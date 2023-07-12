import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api";
import { Event, listen } from "@tauri-apps/api/event";

const terminalElement = document.getElementById("terminal") as HTMLElement;

const fitAddon = new FitAddon();
const term = new Terminal({
  fontFamily: "Jetbrains Mono",
  theme: {
    background: "rgb(47, 47, 47)",
  },
});
term.loadAddon(fitAddon);
term.open(terminalElement);

// Make the terminal fit all the window size
async function fitTerminal() {
  fitAddon.fit();
  void invoke<string>("async_resize_pty", {
    rows: term.rows,
    cols: term.cols,
  });
  // Create a shell if it doesn't exist
  invoke("async_create_shell").catch((error) => {
    // on linux it seem to to "Operation not permitted (os error 1)" but it still works because echo $SHELL give /bin/bash
    console.error("Error creating shell:", error);
  });
}

// Write data from pty into the terminal
function writeToTerminal(ev: Event<string>) {
  term.write(ev.payload);
}

// Write data from the terminal to the pty
function writeToPty(data: string) {
  void invoke("async_write_to_pty", {
    data,
  });
}

term.onData(writeToPty);
addEventListener("resize", fitTerminal);
listen("data", writeToTerminal);
fitTerminal();
