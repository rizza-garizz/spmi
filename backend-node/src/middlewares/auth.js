const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const { failure } = require("../utils/apiResponse");
const { findLocalUserById } = require("../services/localAuth");
const { isLocalTokenBlacklisted } = require("../services/catalogStore");

async function hydrateUser(token) {
  const payload = jwt.verify(token, env.jwtSecret);

  if (env.appMode === "local_mock" || payload.mode === "local") {
    if (isLocalTokenBlacklisted(token)) {
      throw new Error("TOKEN_BLACKLISTED");
    }

    if (payload.iat && Date.now() / 1000 - payload.iat > env.sessionTimeoutSeconds) {
      throw new Error("SESSION_TIMEOUT");
    }

    const user = findLocalUserById(payload.sub);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return { user, payload };
  }

  const blacklisted = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });

  if (blacklisted) {
    throw new Error("TOKEN_BLACKLISTED");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
      deletedAt: null,
      isActive: true,
    },
    include: {
      orgUnit: true,
      institution: true,
      roleAssignments: {
        include: {
          scopeOrgUnit: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return { user, payload };
}

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return failure(res, "Token tidak ditemukan", 401);
  }

  try {
    const { user, payload } = await hydrateUser(token);
    req.user = user;
    req.token = token;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    return failure(res, "Token tidak valid", 401);
  }
}

async function optionalAuth(req, _, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return next();
  }

  try {
    const { user, payload } = await hydrateUser(token);
    req.user = user;
    req.token = token;
    req.tokenPayload = payload;
  } catch (error) {
    req.user = null;
  }

  next();
}

module.exports = {
  verifyToken,
  optionalAuth,
};
