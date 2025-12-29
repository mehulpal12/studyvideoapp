import { PrismaClient } from '@prisma/client/extension';
import { duration } from './../../../node_modules/effect/src/Config';

import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";

dotenv.config();
const prisma = new PrismaClient()

/* ----------------------------------
   Cloudinary Configuration
-----------------------------------*/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ----------------------------------
   Upload Image (Optimized)


   -----------------------------------*/


   interface CloudinaryUploadResult{
    public_id: String;
    bytes: Number;
    duration?:Number
    [key: string] : any
   }

export async function POST(request: NextRequest) {
  
    
    try {
        const {userId} = await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"}, {status:401})
    }
    if(
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ){
        return NextResponse.json({error:"credential is not found"}, {status:500})

    }
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title =formData.get("title") as string;
        const description = formData.get("description") as string
        const originalSize = formData.get("originalSize") as string

        if (!file) {
        return NextResponse.json({error:"fill not found"}, {status:400})
            
        }

        const bytes = await file.arrayBuffer()

        const buffer = Buffer.from(bytes)

      const result =  await new Promise<CloudinaryUploadResult>(
            (resolve, reject) =>{
             const  uploadStream =   cloudinary.uploader.upload_stream(
                    {
                        resource_type : "video",
                        folder:"video-upload",
                    transformation: [
                        {quality:"auto", fetch_format:"mp4"}
                    ]},
                    (error, result)=>{
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult)
                    }
                )

                uploadStream.end(buffer)
            }
        )

        const video = await prisma.video.create({
            data:{
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration:result.duration || 0
            }
        })

        return NextResponse.json(video)
    } catch (error) {
        console.log("upload video failed", error);
        return NextResponse.json({error:"upload image failed"}, {status:400})
        
    } finally{
        await prisma.$disconnect()
    }




}

