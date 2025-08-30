using System;
using System.IO.Pipes;
using System.Threading.Tasks;
using System.Windows;

namespace SmartTV.WebView2Host
{
    public partial class App : Application
    {
        private async void Application_Startup(object sender, StartupEventArgs e)
        {
            // Start MainWindow immediately so it can accept pipe connection and send "ready"
            var win = new MainWindow();
            win.Show();
        }
    }
}