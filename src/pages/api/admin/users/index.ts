import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const { email, password, name, role } = req.body;

    if (!email || !email.includes("@") || !password || password.length < 6) {
      return res.status(422).json({ message: "Invalid input" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(422).json({ message: "User exists already!" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "USER",
      },
    });

    return res.status(201).json({ message: "User created!", userId: user.id });
  }

  if (req.method === "PUT") {
    const { id, name, email, role, password } = req.body;

    if (!id) {
      return res.status(422).json({ message: "Missing user ID" });
    }

    const dataToUpdate: any = { name, email, role };
    if (password && password.length >= 6) {
      dataToUpdate.password = await hashPassword(password);
    }

    try {
      await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });
      return res.status(200).json({ message: "User updated!" });
    } catch (error) {
      return res.status(500).json({ message: "Updating user failed" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.body; // Or query param

    if (!id) {
      return res.status(422).json({ message: "Missing user ID" });
    }

    // Prevent deleting self
    if (id === session.user.id) {
        return res.status(422).json({ message: "Cannot delete yourself" });
    }

    try {
      await prisma.user.delete({
        where: { id },
      });
      return res.status(200).json({ message: "User deleted!" });
    } catch (error) {
      return res.status(500).json({ message: "Deleting user failed" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
