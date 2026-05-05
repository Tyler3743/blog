import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseConnection: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongooseConnection ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseConnection) {
  global.mongooseConnection = cached;
}

export async function connectMongo() {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your environment variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  cached.promise ??= mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
