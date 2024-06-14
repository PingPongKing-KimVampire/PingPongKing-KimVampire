class Printer:
    COLORS = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "magenta": "\033[95m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }
    
    @staticmethod
    def log(message, color="magenta"):
        colorCode = Printer.COLORS.get(color, Printer.COLORS["magenta"])
        resetCode = Printer.COLORS["reset"]
        
        print(f"{colorCode}{message}{resetCode}")