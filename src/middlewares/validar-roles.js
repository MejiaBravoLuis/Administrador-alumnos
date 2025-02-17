export const tieneRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({
                success: false,
                msg: "Please check again your token"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                msg: `Sorry, only teachers can update courses: ${roles.join(", ")}`
            });
        }

        next();
    };
};
