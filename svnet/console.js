const pData = require('./punish.js');
const io = require('../server.js').io;


let commands = {
    "ban": {
        "help": "ip [length reason]",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
				
            let ip = args[0];
            let length = args[1];
            let reason = args.slice(2).join(" ");

            if (reason.trim() == "") reason = "Being retarded? IDK. The fucker that banned you didn't specify.";

            pData.addBan(ip, length, reason);
            console.log(`ban: ${ip},${length},${reason}`);
        }
    },
    "unban": {
        "help": "ip",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
			
            let ip = args[0];
            pData.removeBan(ip);
            console.log(`unban: ${ip}`);
        }
    },
    "mute": {
        "help": "ip [length reason]",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
				
            let ip = args[0];
            let length = args[1];
            let reason = args.slice(2).join(" ");

            pData.mute(ip, length, reason);
            console.log(`mute: ${ip},${length},${reason}`);
        }
    },
    "unmute": {
        "help": "ip",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
			
            let ip = args[0];
            pData.removeMute(ip);
            console.log(`unmute: ${ip}`);
        }
    },
    "warn": {
        "help": "ip [reason]",
        "function": function(args) {
				
            let ip = args[0];
            let reason = args.slice(2).join(" ");

            pData.warning(ip, reason);
            console.log(`warning to: ${ip},${reason}`);
        }
    },
    "kick": {
        "help": "ip [reason]",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
				
            let ip = args[0];
            let reason = args.slice(1).join(" ");

            if (reason.trim() == "") reason = "Being retarded? IDK. The fucker that kicked you didn't specify.";

            pData.kick(ip, reason);
            console.log(`kick: ${ip},${reason}`);
        }
    },
    "report": {
        "help": "ip [reason]",
        "function": function(args) {
				
            let ip = args[0];
            let reason = args.slice(2).join(" ");

            pData.addReport(ip, reason);
            console.log(`report to: ${ip},${reason}`);
        }
    },
    "broadcast": {
        "help": "[txt]",
        "function": function(args) {
			if (args.length === 0)
				return console.log(this.help);
				
            io.emit("broadcast",args.join(" "));
        }
    },
    "help": {
        "function": function() {
            let keys = Object.keys(commands);
			for (var i = 0; i < keys.length; i++) {
                let key = keys[i];
				console.log(`${key}:\t${commands[key].help || 'N/A'}`);
            }
        }
    }
}

exports.listen = function() {
    process.openStdin().addListener("data", function(input) {
        try {
            let list = input.toString().trim().split(" ");
            let command = list[0].toLowerCase();
            let args = list.slice(1);
            let argsString = args.join(" ");
            commands[command]["function"](args);
        } catch(e) {
            console.log("Invalid command.");
        }
    });
}