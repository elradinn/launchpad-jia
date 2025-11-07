import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongoDB/mongoDB";
import { ObjectId } from "mongodb";
import { sanitizeCareerData } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    let requestData = await request.json();
    const { _id } = requestData;

    // Validate required fields
    if (!_id) {
      return NextResponse.json(
        { error: "Job Object ID is required" },
        { status: 400 }
      );
    }

    const { db } = await connectMongoDB();

    // Sanitize all input data to prevent XSS attacks
    const sanitizedData = sanitizeCareerData(requestData);

    let dataUpdates = { ...sanitizedData };

    delete dataUpdates._id;

    const career = {
      ...dataUpdates,
      updatedAt: new Date(),
    };

    await db
      .collection("careers")
      .updateOne({ _id: new ObjectId(_id) }, { $set: career });

    return NextResponse.json({
      message: "Career updated successfully",
      career,
    });
  } catch (error) {
    console.error("Error adding career:", error);
    return NextResponse.json(
      { error: "Failed to add career" },
      { status: 500 }
    );
  }
}
