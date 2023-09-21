import "./style.scss";
import React from "react";
import ReplyIcon from "../../assests/images/reply.png"
import ReplyMessageContext from "../../contexts/ReplyMessageContext";
import MessageStatus from "../MessageStatus";
import ReplyTo from "../ReplyTo";

function findTimeDifferenceMessages(message1, message2) {
    // if message is last message, return 0
    if (message1 && message2) {
        return timeDifferenceInMinutes(message1.time, message2.time)
    }

    return 0;

}


// Function to calculate the time difference between two dates in minutes
function timeDifferenceInMinutes(date1, date2) {
    const differenceInMilliseconds = Math.abs(new Date(date1) - new Date(date2));
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);
    return differenceInMinutes;
}

function checkIfSentBySameUser(message1, message2) {
    if (message1 && message2) {
        return message1.user.id == message2.user.id;
    }
    return false;
}

function getHideAvatarStyle(isMe, message, previousMessage) {

    if (isMe) return " hide-avatar";

    const sentBySameUserAsPreviousMessage = checkIfSentBySameUser(message, previousMessage);
    if (sentBySameUserAsPreviousMessage) {
        return " hide-avatar";
    }

    return " "

}

function getMarginTopStyle(message, previousMessage) {
    const timeDifferentWithPreviousMessage = findTimeDifferenceMessages(message, previousMessage);
    // diplays the message closed to the previous message if the time difference is small
    if (timeDifferentWithPreviousMessage < 1) {
        return " margin-top-1";
    } else if (timeDifferentWithPreviousMessage < 5) {
        return " margin-top-3";
    } else if (timeDifferentWithPreviousMessage < 30) {
        return " margin-top-5";
    } else {
        return " margin-top-10";
    }
}
function getHideTimeStyle(message, nextMessage) {


    // check if the message is the last message
    console.log("next message", nextMessage);
    const isLastMessage = !nextMessage;
    if (isLastMessage) {
        console.log("last message");
        console.log(message);
        return " "; // show time if it is the last message
    }

    // if there is a next message, check if the sender is different with the next message
    const differentSenderWithNextMessage = !checkIfSentBySameUser(message, nextMessage);
    if (differentSenderWithNextMessage) {
        return " "; // show time if the next message is sent by a different user
    }

    // if the next message is sent the same user, check the time difference
    const timeDifferentWithNextMessage = findTimeDifferenceMessages(message, nextMessage);
    if (timeDifferentWithNextMessage > 30) {
        return " "; // show time if the time difference with the next message is more than 30 minutes
    }

    return " hide-time" // otherwise, hide the time

}

function formatTime(time) {
    // format the time to timezone 7 with format HH:mm
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (minutes < 10) {
        return `${hours}:0${minutes}`;
    }
    return `${hours}:${minutes}`;
}



export default function ({ isMe, message, previousMessage, nextMessage }) {

    let style = ''

    style += isMe ? " right" : " left"
    style += getHideAvatarStyle(isMe, message, previousMessage);
    style += getHideTimeStyle(message, nextMessage);
    style += getMarginTopStyle(message, previousMessage);

    const isLastMessage = !nextMessage;
    const formattedTime = formatTime(message.time);
    const { setRepliedMessage, inputBoxRef } = React.useContext(ReplyMessageContext);


    const handleReplyClick = () => {
        setRepliedMessage(message);
        inputBoxRef.current.focus();
    }

    return (
        <div className={`Message ${style}`} title={formattedTime}>
            <div className="avatar">
                <img src={message.user.avatar} alt="" />
            </div>
            <div className="message-detail">
                {message.replyTo && <ReplyTo repliedMessage={message.replyTo} />}
                <div className="message-text">{message.content}</div>
                <div className="time-and-status">
                    <div className="time">{formattedTime}</div>
                    {isLastMessage && <MessageStatus isMe={isMe} message={message} />}
            </div>

            </div>

            {
                !isMe && <div className="reply-btn">
                    <img src={ReplyIcon} alt="" onClick={handleReplyClick} />
                </div>
            }
        </div>
    )
}