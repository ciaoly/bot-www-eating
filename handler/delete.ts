import { Handler, RequestBody } from "../main";
import Mongoose, { Model } from "mongoose";
import { Logger } from "log4js";
import { MongoDBDocumentInterface, MongoDBModelInterface, parser, sendMessage } from "../util";
import { createContext } from "vm";

const _handler = (filter: MongoDBDocumentInterface, msgText: string, IModel: Model<MongoDBModelInterface>, logger: Logger) => {
	let index = Number.parseInt(msgText);
	if (isNaN(index)) {
		sendMessage({
			chat_id: filter.chatId,
			text: "我寻思你发的消息的格式应该有点问题, 你不老实啊" // i18n
		});
		return;
	}
	IModel.findOne(filter).exec((err, res) => {
		if (err) {
			sendMessage({
				chat_id: filter.chatId,
				text: "有点问题. 它出错了" // i18n
			});
			logger.error("start: model.findOne(_filter): err:", err);
			logger.error("start: model.findOne(_filter): filter:", filter);
			return;
		}
		if (!res || !Array.isArray(res.options)) {
			return sendMessage({
				chat_id: filter.chatId,
				text: "木有候选项, 先添加一些候选项吧. " + "/touch" // i18n
			});
		}
		if (index >= res.options.length)
			return sendMessage({
				chat_id: filter.chatId,
				text: "我寻思你发的消息应该有点问题, 你不老实啊" // i18n
			});
		res.options.splice(index, 1);
		res.save();
	});
}

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message || body.edited_message;
	if (!msg) {
		res.json({
			success: false
		});
		next();
		return ctx.Logger.error("Message is undefined:", body);
	}
	const chat = msg.chat;
	const _filter: MongoDBDocumentInterface = {
		chatId: chat.id
	};
	const IModel: Model<MongoDBModelInterface> = Mongoose.model<MongoDBModelInterface>(chat.type, ctx.Schema);
	_handler(_filter, msg.text, IModel, ctx.Logger);
	res.json({
		success: true
	});
	next();
}

export default handler