// createManager.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuid } = require('uuid');

(async () => {
  const utorid = "mgr00001";     // change if you want
  const email  = "mgr00001@mail.utoronto.ca";
  const name   = "Manager One";

  const resetToken = uuid();
  const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const user = await prisma.user.upsert({
    where: { utorid },
    update: { role: "manager", resetToken, expiresAt },
    create: {
      utorid, email, name,
      role: "manager",
      resetToken, expiresAt
    }
  });

  console.log("✅ Seeded manager:", { utorid, email, resetToken, expiresAt });
  process.exit(0);
})();
