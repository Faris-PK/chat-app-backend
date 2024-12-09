import { get } from "http";
import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersSidebar = async (req, res) => {
    try {
        console.log('from getUsersSidebar');
        
        const currentUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: currentUserId}}).select("-password");

        res.status(200).json(filteredUsers)
    } catch (error) {
        console.error("Error in getUsersForSidebar controller: ", error.message);
        res.status(500).json({error: " Internal Server Error"})
    }
}


export const getMessages = async (req, res) => {
    try {
        const {id: userToChatId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId},

            ]
        });
        res.status(200).json(messages)
    } catch (error) {
        console.error("Error in getMessages controller : ", error.message);
        res.status(500).json({error: " Internal Server Error"})
    }
}


export const sendMessage = async (req, res ) => {
    try {
        const { text, image } = req.body;
        const {id: receiverId } = req.params;
        const senderId = req.user._id;

         let imageUrl;
         if (image) {
            // Upoad base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url
         }

         const newMessage = new Message ({
            senderId,
            receiverId,
            text,
            image
         })

         await newMessage.save();
         
         //realtime functionality goes here =>

            const receiverSocketId = getReceiverSocketId(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }

            res.status(201).json(newMessage)
    } catch (error) {
        console.error("Error in sendMessage controller : ", error.message);
        res.status(500).json({error: " Internal Server Error"})
    }
}