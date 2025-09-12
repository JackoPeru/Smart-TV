using Microsoft.Web.WebView2.Core;
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;

namespace SmartTV.WebView2Host
{
    public partial class MainWindow : Window
    {
        private NamedPipeServerStream? _pipe;
        private StreamReader? _reader;
        private StreamWriter? _writer;
        private string _serviceKey = "";
        private string _sessionKey = "";

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            try
            {
                Debug.WriteLine("[Host] MainWindow Loaded: initializing pipe...");
                await InitializePipeAsync();
                Debug.WriteLine("[Host] Pipe initialized and client connected.");
                await SendEventAsync(new { type = "ready" });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] Error during startup: {ex.Message}");
                try { await SendEventAsync(new { type = "error", message = ex.Message, code = "STARTUP" }); } catch { }
                Close();
            }
        }

        private async Task InitializePipeAsync()
        {
            Debug.WriteLine("[Host] Creating NamedPipeServerStream smarttv_webview2...");
            _pipe = new NamedPipeServerStream("smarttv_webview2", PipeDirection.InOut, 1, PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
            Debug.WriteLine("[Host] Waiting for client connection...");

            // Add timeout to avoid persistent black screen if client never connects
            var connectTask = _pipe.WaitForConnectionAsync();
            var timeoutTask = Task.Delay(8000);
            var completed = await Task.WhenAny(connectTask, timeoutTask);
            if (completed == timeoutTask)
            {
                throw new TimeoutException("Timeout while waiting for client to connect to pipe");
            }

            Debug.WriteLine("[Host] Client connected to pipe.");
            _reader = new StreamReader(_pipe, Encoding.UTF8);
            _writer = new StreamWriter(_pipe, new UTF8Encoding(false)) { AutoFlush = true };
            _ = Task.Run(ListenLoopAsync);
        }

        private async Task ListenLoopAsync()
        {
            try
            {
                while (_pipe != null && _pipe.IsConnected)
                {
                    var line = await _reader!.ReadLineAsync();
                    if (line == null) break;
                    try
                    {
                        using var doc = JsonDocument.Parse(line);
                        var root = doc.RootElement;
                        var type = root.GetProperty("type").GetString();
                        switch (type)
                        {
                            case "open":
                                await HandleOpenAsync(root);
                                break;
                            case "nav":
                                await HandleNavAsync(root);
                                break;
                            case "exec":
                                await HandleExecAsync(root);
                                break;
                            case "postMessage":
                                await HandlePostMessageAsync(root);
                                break;
                            case "setBounds":
                                await HandleSetBoundsAsync(root);
                                break;
                            case "close":
                                await Dispatcher.InvokeAsync(Close);
                                break;
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"[Host] Parser error: {ex.Message}");
                        await SendEventAsync(new { type = "error", message = ex.Message, code = "PARSER" });
                    }
                }

                // Pipe disconnected: close window to avoid black rectangle remaining
                await Dispatcher.InvokeAsync(Close);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] Pipe error: {ex.Message}");
                try { await SendEventAsync(new { type = "error", message = ex.Message, code = "PIPE" }); } catch { }
                // On pipe error, close window
                await Dispatcher.InvokeAsync(Close);
            }
        }

        private async Task HandleOpenAsync(JsonElement root)
        {
            try
            {
                _serviceKey = root.GetProperty("service").GetString() ?? "";
                _sessionKey = root.GetProperty("sessionKey").GetString() ?? _serviceKey;
                var url = root.GetProperty("url").GetString() ?? "about:blank";
                var fullscreen = root.TryGetProperty("fullscreen", out var fs) && fs.GetBoolean();
                string? userAgent = null;
                if (root.TryGetProperty("userAgent", out var uaProp) && uaProp.ValueKind == JsonValueKind.String)
                {
                    userAgent = uaProp.GetString();
                }
                Debug.WriteLine($"[Host] HandleOpen: service={_serviceKey} session={_sessionKey} url={url} fullscreen={fullscreen} ua={(userAgent ?? "<default>")}" );

                var userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SmartTV", "sessions", _sessionKey);
                Directory.CreateDirectory(userDataFolder);
                Debug.WriteLine($"[Host] Using profile folder: {userDataFolder}");

                // Use environment with dedicated user data folder
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await WebView.EnsureCoreWebView2Async(env);

                WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                WebView.CoreWebView2.Settings.AreDevToolsEnabled = false;
                // Apply custom Smart TV user agent if provided
                if (!string.IsNullOrWhiteSpace(userAgent))
                {
                    try { WebView.CoreWebView2.Settings.UserAgent = userAgent; }
                    catch (Exception ex) { Debug.WriteLine($"[Host] Failed to set UserAgent: {ex.Message}"); }
                }
                WebView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;
                WebView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

                if (fullscreen)
                {
                    await Dispatcher.InvokeAsync(() => GoFullscreenOnPrimary());
                }

                try
                {
                    WebView.Source = new Uri(url);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"[Host] Navigation error: {ex.Message}");
                    await SendEventAsync(new { type = "error", message = ex.Message, code = "NAV" });
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] HandleOpen error: {ex.Message}");
                await SendEventAsync(new { type = "error", message = ex.Message, code = "OPEN" });
            }
        }

        private void GoFullscreenOnPrimary()
        {
            WindowStyle = WindowStyle.None;
            ResizeMode = ResizeMode.NoResize;
            Topmost = true;
            WindowState = WindowState.Maximized;
        }

        private async Task HandleNavAsync(JsonElement root)
        {
            var cmd = root.GetProperty("cmd").GetString();
            await Dispatcher.InvokeAsync(() =>
            {
                if (WebView.CoreWebView2 == null) return;
                switch (cmd)
                {
                    case "back":
                        if (WebView.CoreWebView2.CanGoBack) WebView.CoreWebView2.GoBack();
                        break;
                    case "forward":
                        if (WebView.CoreWebView2.CanGoForward) WebView.CoreWebView2.GoForward();
                        break;
                    case "reload":
                        WebView.CoreWebView2.Reload();
                        break;
                }
            });
        }

        private async Task HandleExecAsync(JsonElement root)
        {
            var code = root.GetProperty("code").GetString() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(code)) return;
            try
            {
                await WebView.ExecuteScriptAsync(code);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] Exec error: {ex.Message}");
                await SendEventAsync(new { type = "error", message = ex.Message, code = "EXEC" });
            }
        }

        private async Task HandlePostMessageAsync(JsonElement root)
        {
            if (!root.TryGetProperty("payload", out var payload)) return;
            var json = payload.GetRawText();
            try
            {
                WebView.CoreWebView2.PostWebMessageAsJson(json);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] PostMessage error: {ex.Message}");
                await SendEventAsync(new { type = "error", message = ex.Message, code = "POST" });
            }
        }

        private async Task HandleSetBoundsAsync(JsonElement root)
        {
            var x = root.GetProperty("x").GetInt32();
            var y = root.GetProperty("y").GetInt32();
            var width = root.GetProperty("width").GetInt32();
            var height = root.GetProperty("height").GetInt32();
            await Dispatcher.InvokeAsync(() =>
            {
                Left = x;
                Top = y;
                Width = width;
                Height = height;
            });
        }

        private async void CoreWebView2_NavigationCompleted(object? sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            var url = WebView.Source?.ToString() ?? "";
            await SendEventAsync(new { type = "navigated", url });
        }

        private async void CoreWebView2_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var json = e.WebMessageAsJson;
                await SendEventAsync(new { type = "mediaStateChanged", payload = JsonSerializer.Deserialize<object>(json) });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[Host] WebMessage error: {ex.Message}");
                await SendEventAsync(new { type = "error", message = ex.Message, code = "WEBMSG" });
            }
        }

        private async Task SendEventAsync(object evt)
        {
            if (_writer == null) return;
            var json = JsonSerializer.Serialize(evt);
            await _writer.WriteLineAsync(json);
        }

        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);
            try
            {
                _writer?.Dispose();
                _reader?.Dispose();
                _pipe?.Dispose();
            }
            catch { }
        }
    }
}