
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, ShieldIcon, BarChart3Icon, ServerIcon, LockIcon } from "lucide-react";

const SOC2 = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in font-sans">
        <div>
          <h1 className="mt-16 text-3xl font-bold tracking-tight bg-gradient-to-r from-securetrack-purple to-securetrack-green bg-clip-text text-transparent animate-fade-in">
            SOC 2 Compliance
          </h1>
          <p className="text-muted-foreground mt-2 animate-fade-up" style={{animationDelay: '0.1s'}}>
            Track and manage your SOC 2 compliance progress.
          </p>
        </div>

        {/* <Card className="mb-6 animate-fade-up glass-effect overflow-hidden border-none"> */}
        <Card className="col-span-full bg-gradient-to-r from-securetrack-purple/10 via-securetrack-green/10 to-securetrack-purple/5 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-securetrack-green animate-pulse" />
              <span>Overall Compliance Progress</span>
            </CardTitle>
            <CardDescription>Your organization is 68% compliant with SOC 2 requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={68} className="h-3 bg-gray-100" indicatorClassName="bg-gradient-to-r from-securetrack-purple to-securetrack-green" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span className="font-medium">0%</span>
              <span className="font-medium">100%</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="animate-fade-up card-hover overflow-hidden" style={{ animationDelay: "0.1s" }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-securetrack-purple"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-securetrack-purple/10 flex items-center justify-center transition-all duration-300 group-hover:bg-securetrack-purple/20 group-hover:scale-110">
                  <ShieldIcon className="h-5 w-5 text-securetrack-green" />
                </div>
                <span>Security</span>
              </CardTitle>
              <CardDescription>Protection of system resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Access Control</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">System Security</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Incident Management</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">In Progress</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full group transition-all duration-300 hover:bg-securetrack-purple/10 hover:text-securetrack-purple">
                View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="animate-fade-up card-hover overflow-hidden" style={{ animationDelay: "0.2s" }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-securetrack-green"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-securetrack-green/10 flex items-center justify-center transition-all duration-300 group-hover:bg-securetrack-green/20 group-hover:scale-110">
                  <ServerIcon className="h-5 w-5 text-securetrack-green" />
                </div>
                <span>Availability</span>
              </CardTitle>
              <CardDescription>System availability for operation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Performance Monitoring</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Disaster Recovery</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Incident Response</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full group transition-all duration-300 hover:bg-securetrack-green/10 hover:text-securetrack-green">
                View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="animate-fade-up card-hover overflow-hidden" style={{ animationDelay: "0.3s" }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500/20 group-hover:scale-110">
                  <BarChart3Icon className="h-5 w-5 text-blue-500" />
                </div>
                <span>Processing Integrity</span>
              </CardTitle>
              <CardDescription>Accurate processing of information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Quality Assurance</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Process Monitoring</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">In Progress</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Error Handling</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">Not Started</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full group transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-500">
                View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="animate-fade-up card-hover overflow-hidden" style={{ animationDelay: "0.4s" }}>
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:scale-110">
                  <LockIcon className="h-5 w-5 text-indigo-500" />
                </div>
                <span>Confidentiality</span>
              </CardTitle>
              <CardDescription>Protection of confidential information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Data Classification</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-securetrack-green" />
                  <span className="text-sm">Encryption</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Access Controls Review</span>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">In Progress</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full group transition-all duration-300 hover:bg-indigo-500/10 hover:text-indigo-500">
                View Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Card className="animate-fade-up mt-6" style={{ animationDelay: "0.5s" }}>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <span className="bg-gradient-to-r from-securetrack-purple to-securetrack-green bg-clip-text text-transparent">
                Next Steps for Compliance
              </span>
            </CardTitle>
            <CardDescription>
              Complete these tasks to improve your SOC 2 compliance status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
              <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Complete Incident Management Process</h3>
                <p className="text-sm text-muted-foreground">Define and document incident response procedures</p>
              </div>
              <Button variant="outline" size="sm">Start</Button>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
              <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Implement Process Monitoring</h3>
                <p className="text-sm text-muted-foreground">Set up continuous monitoring for critical processes</p>
              </div>
              <Button variant="outline" size="sm">Start</Button>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-all">
              <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Develop Error Handling Framework</h3>
                <p className="text-sm text-muted-foreground">Create standardized error handling protocols</p>
              </div>
              <Button variant="outline" size="sm">Start</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SOC2;