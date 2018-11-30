// Copyright (c) .NET Foundation. All rights reserved.
// Licensed under the Apache License, Version 2.0. See License.txt in the project root for license information.
import { Buffer } from "buffer";
import * as msgpack5 from "msgpack5";
import { LogLevel, MessageType, NullLogger, TransferFormat } from "@aspnet/signalr";
import { BinaryMessageFormat } from "./BinaryMessageFormat";
// TypeDoc's @inheritDoc and @link don't work across modules :(
/** Implements the MessagePack Hub Protocol */
var MessagePackHubProtocol = /** @class */ (function () {
    function MessagePackHubProtocol() {
        /** The name of the protocol. This is used by SignalR to resolve the protocol between the client and server. */
        this.name = "messagepack";
        /** The version of the protocol. */
        this.version = 1;
        /** The TransferFormat of the protocol. */
        this.transferFormat = TransferFormat.Binary;
    }
    /** Creates an array of HubMessage objects from the specified serialized representation.
     *
     * @param {ArrayBuffer} input An ArrayBuffer containing the serialized representation.
     * @param {ILogger} logger A logger that will be used to log messages that occur during parsing.
     */
    MessagePackHubProtocol.prototype.parseMessages = function (input, logger) {
        var _this = this;
        // The interface does allow "string" to be passed in, but this implementation does not. So let's throw a useful error.
        if (!(input instanceof ArrayBuffer)) {
            throw new Error("Invalid input for MessagePack hub protocol. Expected an ArrayBuffer.");
        }
        if (logger === null) {
            logger = NullLogger.instance;
        }
        return BinaryMessageFormat.parse(input).map(function (m) { return _this.parseMessage(m, logger); });
    };
    /** Writes the specified HubMessage to an ArrayBuffer and returns it.
     *
     * @param {HubMessage} message The message to write.
     * @returns {ArrayBuffer} An ArrayBuffer containing the serialized representation of the message.
     */
    MessagePackHubProtocol.prototype.writeMessage = function (message) {
        switch (message.type) {
            case MessageType.Invocation:
                return this.writeInvocation(message);
            case MessageType.StreamInvocation:
                return this.writeStreamInvocation(message);
            case MessageType.StreamItem:
            case MessageType.Completion:
                throw new Error("Writing messages of type '" + message.type + "' is not supported.");
            default:
                throw new Error("Invalid message type.");
        }
    };
    MessagePackHubProtocol.prototype.parseMessage = function (input, logger) {
        if (input.length === 0) {
            throw new Error("Invalid payload.");
        }
        var msgpack = msgpack5();
        var properties = msgpack.decode(new Buffer(input));
        if (properties.length === 0 || !(properties instanceof Array)) {
            throw new Error("Invalid payload.");
        }
        var messageType = properties[0];
        switch (messageType) {
            case MessageType.Invocation:
                return this.createInvocationMessage(this.readHeaders(properties), properties);
            case MessageType.StreamItem:
                return this.createStreamItemMessage(this.readHeaders(properties), properties);
            case MessageType.Completion:
                return this.createCompletionMessage(this.readHeaders(properties), properties);
            case MessageType.Ping:
                return this.createPingMessage(properties);
            case MessageType.Close:
                return this.createCloseMessage(properties);
            default:
                // Future protocol changes can add message types, old clients can ignore them
                logger.log(LogLevel.Information, "Unknown message type '" + messageType + "' ignored.");
                return null;
        }
    };
    MessagePackHubProtocol.prototype.createCloseMessage = function (properties) {
        // check minimum length to allow protocol to add items to the end of objects in future releases
        if (properties.length < 2) {
            throw new Error("Invalid payload for Close message.");
        }
        return {
            // Close messages have no headers.
            error: properties[1],
            type: MessageType.Close,
        };
    };
    MessagePackHubProtocol.prototype.createPingMessage = function (properties) {
        // check minimum length to allow protocol to add items to the end of objects in future releases
        if (properties.length < 1) {
            throw new Error("Invalid payload for Ping message.");
        }
        return {
            // Ping messages have no headers.
            type: MessageType.Ping,
        };
    };
    MessagePackHubProtocol.prototype.createInvocationMessage = function (headers, properties) {
        // check minimum length to allow protocol to add items to the end of objects in future releases
        if (properties.length < 5) {
            throw new Error("Invalid payload for Invocation message.");
        }
        var invocationId = properties[2];
        if (invocationId) {
            return {
                arguments: properties[4],
                headers: headers,
                invocationId: invocationId,
                target: properties[3],
                type: MessageType.Invocation,
            };
        }
        else {
            return {
                arguments: properties[4],
                headers: headers,
                target: properties[3],
                type: MessageType.Invocation,
            };
        }
    };
    MessagePackHubProtocol.prototype.createStreamItemMessage = function (headers, properties) {
        // check minimum length to allow protocol to add items to the end of objects in future releases
        if (properties.length < 4) {
            throw new Error("Invalid payload for StreamItem message.");
        }
        return {
            headers: headers,
            invocationId: properties[2],
            item: properties[3],
            type: MessageType.StreamItem,
        };
    };
    MessagePackHubProtocol.prototype.createCompletionMessage = function (headers, properties) {
        // check minimum length to allow protocol to add items to the end of objects in future releases
        if (properties.length < 4) {
            throw new Error("Invalid payload for Completion message.");
        }
        var errorResult = 1;
        var voidResult = 2;
        var nonVoidResult = 3;
        var resultKind = properties[3];
        if (resultKind !== voidResult && properties.length < 5) {
            throw new Error("Invalid payload for Completion message.");
        }
        var completionMessage = {
            error: null,
            headers: headers,
            invocationId: properties[2],
            result: null,
            type: MessageType.Completion,
        };
        switch (resultKind) {
            case errorResult:
                completionMessage.error = properties[4];
                break;
            case nonVoidResult:
                completionMessage.result = properties[4];
                break;
        }
        return completionMessage;
    };
    MessagePackHubProtocol.prototype.writeInvocation = function (invocationMessage) {
        var msgpack = msgpack5();
        var payload = msgpack.encode([MessageType.Invocation, invocationMessage.headers || {}, invocationMessage.invocationId || null,
            invocationMessage.target, invocationMessage.arguments]);
        return BinaryMessageFormat.write(payload.slice());
    };
    MessagePackHubProtocol.prototype.writeStreamInvocation = function (streamInvocationMessage) {
        var msgpack = msgpack5();
        var payload = msgpack.encode([MessageType.StreamInvocation, streamInvocationMessage.headers || {}, streamInvocationMessage.invocationId,
            streamInvocationMessage.target, streamInvocationMessage.arguments]);
        return BinaryMessageFormat.write(payload.slice());
    };
    MessagePackHubProtocol.prototype.readHeaders = function (properties) {
        var headers = properties[1];
        if (typeof headers !== "object") {
            throw new Error("Invalid headers.");
        }
        return headers;
    };
    return MessagePackHubProtocol;
}());
export { MessagePackHubProtocol };
//# sourceMappingURL=MessagePackHubProtocol.js.map