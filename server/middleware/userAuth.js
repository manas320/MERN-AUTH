import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized. Login Again' });
    }

    try {
        // Decode the token using your Secret Key
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.id) {
            req.body = req.body || {};
            // Add the userId to the request body so controllers can use it
            req.body.userId = tokenDecode.id;
        } else {
            return res.json({ success: false, message: 'Not Authorized. Login Again' });
        }

        // Move to the next function (the controller)
        next();

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export default userAuth;