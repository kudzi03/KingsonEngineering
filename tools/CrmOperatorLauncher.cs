// Small Windows GUI launcher: no console flash, shell interpretation or stored credentials.
// Compiled with Windows' existing .NET Framework compiler; deployed only in the private operator folder.
using System;
using System.IO;
using System.Diagnostics;
using System.Reflection;

internal static class CrmOperatorLauncher {
  private static string root;
  private static void Status(string state, int code) {
    File.WriteAllText(Path.Combine(root, "launcher-status.json"),
      "{\"at\":\"" + DateTime.UtcNow.ToString("o") + "\",\"state\":\"" + state + "\",\"exitCode\":" + code + "}");
  }
  [STAThread]
  private static int Main(string[] args) {
    root = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
    try {
      string extra = "";
      foreach (string arg in args) {
        if (arg != "--force-backup" && arg != "--rescan") throw new ArgumentException();
        extra += " " + arg;
      }
      var info = new ProcessStartInfo(@"C:\Program Files\nodejs\node.exe",
        "\"" + Path.Combine(root, "crm-operator.mjs") + "\"" + extra);
      info.WorkingDirectory = root;
      info.UseShellExecute = false;
      info.CreateNoWindow = true;
      info.RedirectStandardOutput = true;
      info.RedirectStandardError = true;
      info.EnvironmentVariables["KINGSON_OPS_HOME"] = root;
      using (var child = new Process()) {
        child.StartInfo = info;
        child.OutputDataReceived += delegate(object sender, DataReceivedEventArgs data) {};
        child.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs data) {};
        child.Start();
        child.BeginOutputReadLine();
        child.BeginErrorReadLine();
        Status("running", 0);
        child.WaitForExit();
        Status(child.ExitCode == 0 ? "complete" : "failed", child.ExitCode);
        return child.ExitCode;
      }
    } catch {
      try { Status("launcher_failed", 1); } catch {}
      return 1;
    }
  }
}
