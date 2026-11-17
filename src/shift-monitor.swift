import CoreGraphics
import Foundation

// Poll only the combined Shift flag. No key events or typed text are observed.
var previous = CGEventSource.flagsState(.combinedSessionState).contains(.maskShift)
print("READY")
fflush(stdout)

let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .userInteractive))
timer.schedule(deadline: .now(), repeating: .milliseconds(20), leeway: .milliseconds(5))
timer.setEventHandler {
    let down = CGEventSource.flagsState(.combinedSessionState).contains(.maskShift)
    if down != previous {
        previous = down
        print(down ? "DOWN" : "UP")
        fflush(stdout)
    }
}
timer.resume()
dispatchMain()
