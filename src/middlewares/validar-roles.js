export const tieneRole = (...roles) => {
    return (req, res, next) => {
        if(!req.usuario){
            return res.status(500).json({
                succes: false,
                msg: 'Se quiere verificar un role sin validar el token primero'
            })
        }
        next();
    }

}