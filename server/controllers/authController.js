import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js'; // Adjust path based on your folder structure
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password) {
        return res.json({ success: false, message: 'Missing Details' });
    }

    try {
        // 2. Check if user already exists
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Create and Save new user
        const user = new userModel({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // 5. Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // 6. Send Token in a Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        

        const mailOptions = {
            from: process.env.SENDER_EMAIL, // Your verified email in Brevo
            to: user.email,
            subject: 'Welcome to our App',
            text: `Hello ${user.name}, your account has been created.`
        };

        console.log("Attempting to send email to:", email);
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");

      return res.json({ success: true, message: "User registered successfully" });     

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
        return res.json({ success: false, message: 'Email and password are required' });
    }

    try {
        // 2. Find user by email
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid email" });
        }

        // 3. Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        // 4. Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // 5. Send Token in a Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.json({ success: true, message: "Logged in successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({ success: true, message: "Logged Out" });
        
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account is already verified" });
        }

        // Generate a 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Save OTP and Expiry (e.g., 24 hours) to user document
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        // Send the Email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            //text: `Your OTP for verifying your account is ${otp}. Use this code to verify your account.`,
           html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "Verification OTP sent to your email" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // 1. Check if OTP matches
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // 2. Check if OTP is expired
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        // 3. Mark user as verified and clear the OTP fields
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Email verified successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        // If the code execution reaches here, it means the userAuth middleware 
        // has already verified the token successfully.
        return res.json({ success: true });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: 'Email is required' });
    }

    try {
        // Find user by email
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Save OTP and Expiry (e.g., 15 minutes for security)
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        // Send the email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
           // text: `Your OTP for resetting your password is ${otp}. Use this code to proceed with resetting your password.`
           html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'OTP sent to your email' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // 1. Verify OTP
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        // 2. Check Expiration
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP Expired' });
        }

        // 3. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update user password and clear reset fields
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}