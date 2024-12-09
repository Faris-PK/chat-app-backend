import cloudinary from '../lib/cloudinary.js';
import { generateToken } from '../lib/util.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
//signup

export const signup = async (req, res ) => {
    try {
        const  {fullName, email, password} = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({message: 'All field is required'})
        }

        if (password.length < 6) {
            return res.status(400).json({message: 'Password must be at least 6 character'})
        }

        const user = await User.findOne({email});
        if (user) {
            return res.status(400).json({message: 'Email already exists'})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User ({
            fullName,
            email,
            password: hashedPassword
        })

        if (newUser) {
            //generate jwt token
            generateToken(newUser._id, res)
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                emai: newUser.email,
                profilePic: newUser.profilePic,
            })
            
        }else{
            res.status(400).json({message: "Invalid user data"})
        }

    } catch (error) {
        console.log('Error in signup controller', error.message);
        res.status(500).json({message: "internal Server Error"})
    }
}

//login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" }); 
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


//logout

export const logout = async(req, res ) => {
    try {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message: "Logout successfully"})
    } catch (error) {
        console.log('Error in logout controller', error.message);
        res.status(500).json({message: "Internal Server Error"})

    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile pic is required" });
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new: true});

        res.status(200).json(updatedUser);
        


    } catch (error) {
        console.log('error in update profile:', error);
        res.status(500).jso({message: "Internal server error"});
        
    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);

    } catch (error) {
        console.log('Error in checkAuth controller', error.message);
        res.status(500).json({ })
    } 
}