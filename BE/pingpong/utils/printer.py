class Printer:
    COLORS = {
        "black": "\033[30m",
        "red": "\033[31m",
        "green": "\033[32m",
        "yellow": "\033[33m",
        "blue": "\033[34m",
        "magenta": "\033[35m",
        "cyan": "\033[36m",
        "white": "\033[37m",
        "bright_black": "\033[90m",
        "bright_red": "\033[91m",
        "bright_green": "\033[92m",
        "bright_yellow": "\033[93m",
        "bright_blue": "\033[94m",
        "bright_magenta": "\033[95m",
        "bright_cyan": "\033[96m",
        "bright_white": "\033[97m",
        "reset": "\033[0m"
    }
    
    @staticmethod
    def log(message, color="magenta"):
        colorCode = Printer.COLORS.get(color, Printer.COLORS["magenta"])
        resetCode = Printer.COLORS["reset"]
        
        print(f"{colorCode}{message}{resetCode}")

# 예제 출력
Printer.log("This is a black message", "black")
Printer.log("This is a red message", "red")
Printer.log("This is a green message", "green")
Printer.log("This is a yellow message", "yellow")
Printer.log("This is a blue message", "blue")
Printer.log("This is a magenta message", "magenta")
Printer.log("This is a cyan message", "cyan")
Printer.log("This is a white message", "white")
Printer.log("This is a bright black message", "bright_black")
Printer.log("This is a bright red message", "bright_red")
Printer.log("This is a bright green message", "bright_green")
Printer.log("This is a bright yellow message", "bright_yellow")
Printer.log("This is a bright blue message", "bright_blue")
Printer.log("This is a bright magenta message", "bright_magenta")
Printer.log("This is a bright cyan message", "bright_cyan")
Printer.log("This is a bright white message", "bright_white")