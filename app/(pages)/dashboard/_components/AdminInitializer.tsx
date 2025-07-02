"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function AdminInitializer() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const initializeAdmin = useMutation(api.admin.initializeAdminUser);

  const handleInitialize = async () => {
    setStatus("loading");
    setMessage("");
    
    try {
      const result = await initializeAdmin({});
      setStatus("success");
      setMessage("Admin profile initialized successfully! You can now remove the temporary bypass.");
      console.log("Admin initialization result:", result);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to initialize admin profile");
      console.error("Admin initialization error:", error);
    }
  };

  if (status === "success") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Admin Profile Initialized
          </CardTitle>
          <CardDescription className="text-green-700">
            Your admin profile has been successfully created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Admin Setup Required
        </CardTitle>
        <CardDescription className="text-yellow-700">
          Initialize your admin profile to complete the setup process.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-yellow-700">
          You're currently using a temporary bypass for admin access. Click the button below to create your admin profile in the database.
        </p>
        
        <Button 
          onClick={handleInitialize}
          disabled={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Admin Profile...
            </>
          ) : (
            "Initialize Admin Profile"
          )}
        </Button>
        
        {status === "error" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
