import userModel from "../models/userModel.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find user by ID and exclude the password field for security
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
                // Add any other fields you want to show on the profile/dashboard
            }
        });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}