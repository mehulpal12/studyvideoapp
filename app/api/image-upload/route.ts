
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";

dotenv.config();

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
    [key: string] : any
   }

export async function uploadImage(request: NextRequest) {
  
    const {userId} = await auth();
    if(!userId){
        return NextResponse.json({error:"Unauthorized"}, {status:401})
    }
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
        return NextResponse.json({error:"fill not found"}, {status:400})
            
        }

        const bytes = await file.arrayBuffer()

        const buffer = Buffer.from(bytes)

      const result =  await new Promise<CloudinaryUploadResult>(
            (resolve, reject) =>{
             const  uploadStream =   cloudinary.uploader.upload_stream(
                    {folder:"next-saas"},
                    (error, result)=>{
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult)
                    }
                )

                uploadStream.end(buffer)
            }
        )

        return NextResponse.json({publicId: result.public_id}, {status:200})

    } catch (error) {
        console.log("upload image failed", error);
        return NextResponse.json({error:"upload image failed"}, {status:400})
        
    }




}

