const log = require('./log.js').log;
const fs = require('fs-extra');
const settings = require('../json/settings.json');
const io = require('../server.js').io;
const sanitize = require('sanitize-html');

const { EmbedBuilder, WebhookClient } = require('discord.js');
const reports_hook = new WebhookClient({url: settings.sv.discord.urls.reports});
const admx_hook = new WebhookClient({url: settings.sv.discord.urls.admin});


let bans;
let mutes;


function replace_crap(string) {
return string
    .replaceAll("@", "%")
    .replaceAll("`", "\u200B ")
    .replaceAll(" ", "\u200B ")
    .replaceAll("http://", "hgrunt/ass.wav ")
    .replaceAll("https://", "hgrunt/ass.wav ")
    .replaceAll("discord.gg/", "hgrunt/ass.wav ")
    .replaceAll("discord.com/", "hgrunt/ass.wav ")
    .replaceAll("bonzi.lol", "bwe ")
    .replaceAll("bonzi.ga", "bwe ")
    .replaceAll("*", " ")
    .replaceAll("|", " ")
    .replaceAll("~", " ");
}


exports.init = () => {
	fs.writeFile('../json/bans.json', "{}", { flag: 'wx' }, (err) => {
		if (!err)
			console.log("Created empty bans list.");
		try {
			bans = require('../json/bans.json');
		} catch (e) {
			throw "Could not load bans.json. Check syntax and permissions.";
		}
	});
	fs.writeFile('../json/mutes.json', "{}", { flag: 'wx' }, (err) => {
		if (!err)
			console.log("Created empty mutes list.");
		try {
			mutes = require('../json/mutes.json');
		} catch (e) {
			throw "Could not load mutes.json. Check syntax and permissions.";
		}
	});
};

exports.saveBans = () => {
	fs.writeFile(
		'../json/bans.json',
		JSON.stringify(bans),
		{ flag: 'w' },
		(error) => {
			log.info.log('info', 'banSave', {
				error: error
			});
		}
	);
};

exports.saveReport = () => {
	fs.writeFile(
		'../json/reports.json',
		JSON.stringify(reports)
	);
};

exports.saveMutes = () => {
	fs.writeFile(
		'../json/mutes.json',
		JSON.stringify(mutes),
		{ flag: 'w' },
		(error) => {
			log.info.log('info', 'banSave', {
				error: error
			});
		}
	);
}; 


// Ban length is in minutes
exports.addBan = (ip, length, reason) => {
	length = parseFloat(length) || settings.banLength;
	reason = reason || "N/A";
	bans[ip] = {
		name: reason,
		end: new Date().getTime() + (length * 60000)
	};

	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.handshake.headers['cf-connecting-ip'] == ip)
			exports.handleBan(socket);
	}
	exports.saveBans();
};


exports.removeBan = (ip) => {
	delete bans[ip];
	exports.saveBans();
};

exports.removeSocket = (ip) => {
	delete ips[ip];
	exports.saveIps();
};
exports.removeMute = (ip) => {
	delete mutes[ip];
	exports.saveMutes();
};

exports.handleReport = (name) => {
	var ip = name;
	return true;
};

exports.handleBan = (socket) => {
	var ip = socket.handshake.headers['cf-connecting-ip'] || socket.request.connection.remoteAddress;
	var agent = socket.handshake.headers['user-agent'];
	if (bans[ip].end <= new Date().getTime()) {
		exports.removeBan(ip);
		return false;
	}

	log.access.log('info', 'ban', {
		ip: ip
	});
	socket.emit('ban', {
		reason: bans[ip].reason,
		end: bans[ip].end
	});
	socket.disconnect();
	return true;
};
exports.handleReport = (name) => {
	var ip = name;
	var username = replace_crap(reports[ip].username);
	var reason = replace_crap(reports[ip].reason);
	var reporter = replace_crap(reports[ip].reporter);
	var rid = replace_crap(reports[ip].rid);
	var acronym = settings.sv.info.identifier;


	const IMAGE_URL = settings.sv.discord.icons.default;
	const reportEmbed = {
		color: 0xCF14B0,
		author: {
			name: `${settings.sv.info.name} | v${settings.sv.info.ver}`,
			icon_url: IMAGE_URL,
			url: 'https://github.com/CosmicStar98/BonziWORLD-Enhanced',
		},
		fields: [
			{
				name: 'Who:',
				value: username,
				inline: true,
			},
			{
				name: 'Room ID:',
				value: rid,
				inline: true,
			},
			{
				name: 'Reason:',
				value: reason,
				inline: true,
			},
			{
				name: 'Reporter:',
				value: reporter,
				inline: true,
			},
		],
		timestamp: new Date().toISOString(),
		footer: {
			text: `Sent from the ${acronym.toUpperCase()} website.`,
			icon_url: IMAGE_URL,
		},
	};

	try {
		if (settings.sv.discord.enabled == true) {if (settings.sv.discord.show_embeds == true) {
			reports_hook.send({username: `${reporter}  -  New Report!`, avatarURL: IMAGE_URL, embeds: [reportEmbed]});
		} else {
			reports_hook.send({username: `${reporter}  -  New Report!`, avatarURL: IMAGE_URL, content: `> \u0060\n**Who: **${username}\n**Room ID: **${rid}\n**Reason: **${reason}.\n**Reporter: **${reporter}\u0060`});
		}}
	} catch (err) {
		console.log(`WTF?: ${err.stack}`);
	}
	console.log(`!!REPORT!!\nWho: ${username}\nRoom ID: ${rid}\nReason: ${reason}.\nReporter: ${reporter}`);
	return true;
};
exports.handleMute = (socket) => {
	var ip = socket.request.connection.remoteAddress;
	if (mutes[ip].end <= new Date().getTime()) {
		exports.removeMute(ip);
		return false;
	}

	log.access.log('info', 'mute', {
		ip: ip
	});
	socket.emit('mute', {
		reason: `${mutes[ip].reason} <button onclick='hidemute()'>Close</button>`,
		end: mutes[ip].end
	});
	return true;
};
exports.kick = (ip, reason) => {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);

	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			socket.emit('kick', {
				reason: reason || "N/A"
			});
			socket.disconnect();
		}
	}
};

exports.warning = function(ip, reason) {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	reason = reason || "N/A";
	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			socket.emit('warning', {
				reason: `${reason} <button onclick='hidewarning()'>Close</button>`
			});
		}
	}
};

exports.mute = (ip, length, reason) => {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	length = parseFloat(length) || settings.banLength;
	mutes[ip] = {
		reason: reason,
		end: new Date().getTime() + (length * 600)
	};
	reason = reason || "N/A";
	for (var i = 0; i < socketList.length; i++) {
		var socket = sockets[socketList[i]];
		if (socket.request.connection.remoteAddress == ip) {
			exports.handleMute(socket);
		}
	}

	exports.saveMutes();
};
exports.addReport = (name, username, reason, reporter, rid) => {
	var sockets = io.sockets.sockets;
	var socketList = Object.keys(sockets);
	reports[name] = {
		username: username,
		reporter: reporter,
		rid: rid,
		reason: reason
	};
	reason = reason || "N/A";
	username = username || "missingno";
	reporter = reporter || "FAK SAN WAT ARE YOU DOING, NO!";
	rid = rid || "ERROR! Can't get room id";
	exports.handleReport(name);
	exports.saveReport();
};

exports.isBanned = (ip) => Object.keys(bans).indexOf(ip) != -1;
exports.isSocketIn = (ip) => Object.keys(ips).indexOf(ip) != -1;
exports.isMuted = (ip) => Object.keys(mutes).indexOf(ip) != -1;