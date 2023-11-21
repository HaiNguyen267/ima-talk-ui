import "./style.scss";
import React from "react";
import { useContext } from "react";
import ReplyMessageContext from "../../contexts/ReplyMessageContext";
import { truncateString } from "../../utils/Utils";

export default function ({ senderName, messageContent }) {

    console.log("senderName", senderName);
    console.log("messageContent", messageContent);

    const { setRepliedMessage } = React.useContext(ReplyMessageContext);
    const truncatedUserName = truncateString(senderName, 10);
    const truncatedMessage = truncateString(messageContent, 20);
    return (
        <div className="ReplyToInputFooter">
            <div className="detail">
                <div className="heading">
                    Reply to <b className="sender-name">{truncatedUserName}</b>
                </div>
                <div className="content">{truncatedMessage}</div>
            </div>
            <div className="close-btn" onClick={() => setRepliedMessage(null)}>
                <i class="fa-solid fa-circle-xmark"></i>
            </div>

        </div>
    )
}