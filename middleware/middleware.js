import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.locals.user = null; 
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (error) {
    console.error("Token error:", error);
    res.locals.user = null; 
    next();
  }
};

export const requireAuth = (req,res,next)=>{
  if(!req.user) {
    return res.render('message', {
      title: 'Ошибка',
      message: 'Вы должны войти в систему, чтобы забронировать зал',
      link: '/login'
    });
  }
  next();
}