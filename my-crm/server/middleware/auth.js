const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect CRM endpoints with a signed token tied to a stored user record.
//erifies Authorization
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) { //If no token is provided, the user is not authenticated and access is denied.
    return res.status(401).json({ message: "Unauthorized. Please sign in." }); //The client receives a 401 Unauthorized response, prompting them to sign in to access the protected resource.
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); //If a token is provided, the middleware attempts to verify it using the JWT secret. If the token is valid, the payload is extracted, which typically contains the user ID and other relevant information.
    const user = await User.findById(payload.userId).lean(); //The middleware then looks up the user in the database using the ID from the token payload. If the user exists, their information is attached to the request object (req.user) for use in subsequent route handlers.

    if (!user) { //If the user cannot be found in the database, it means the token is valid but does not correspond to an active user account. In this case, access is denied.
      return res.status(401).json({ message: "Unauthorized. Please sign in." });
    }

    req.user = { //If the user is found, their information is attached to the request object (req.user) for use in subsequent route handlers.
      id: String(user._id),
      name: user.name,
      email: user.email,
    };

    next(); //If everything checks out, the middleware calls next() to pass control to the next middleware function or route handler in the Express.js request-response cycle.
  } catch {
    return res.status(401).json({ message: "Unauthorized. Please sign in." }); //If the token verification fails (e.g., due to an invalid token, expired token, or any other error), the middleware catches the error and responds with a 401 Unauthorized status, prompting the client to sign in again.
  }
}

module.exports = authMiddleware;