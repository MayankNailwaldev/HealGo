const bcrypt = require("bcryptjs");

async function generateHash() {
  try {
    const password = "mr.mayankcosm";
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("HASHED PASSWORD:");
    console.log(hashedPassword);
  } catch (error) {
    console.error("Error:", error);
  }
}

generateHash();
