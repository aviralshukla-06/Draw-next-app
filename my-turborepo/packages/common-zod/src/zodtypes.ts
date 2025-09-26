import { z } from "zod"

export const createUserSchema = z.object({
    fullName: z.string(),
    email: z.email(),
    password: z.string().min(8)
})


export const signInSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
})

export const roomSchema = z.object({
    name: z.string().max(30)
})