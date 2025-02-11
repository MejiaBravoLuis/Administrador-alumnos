'use strict';

import mongoose from "mongoose";

export const dbConnection = async () =>{
    try{
        mongoose.connection.on('error', ()=>{
            console.log('Could not be connected to MongoDB');
            mongoose.disconnect();
        });

        mongoose.connection.on('connecting', ()=>{
            console.log('Try Connecting');
        });

        mongoose.connection.on('connected', ()=>{
            console.log('connected to MongoDB');
        });

        mongoose.connection.on('open', ()=>{
            console.log('connected to database');
        });

        mongoose.connection.on('reconnected', ()=>{
            console.log('reconnected to MongoDB');
        });

        mongoose.connection.on('disconnected', ()=>{
            console.log('disconnected');
        });

        mongoose.connect(process.env.URI_MONGO, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 50,
        });
    }catch(error){
        console.log('Database connection failed' , error);
    }
}