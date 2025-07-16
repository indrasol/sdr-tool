
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, FolderIcon, SearchIcon, ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

const Documents = () => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in font-sans mt-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-securetrack-purple to-securetrack-green bg-clip-text text-transparent animate-fade-in">
              Documents
            </h1>
            <p className="text-muted-foreground mt-2 animate-fade-up" style={{animationDelay: '0.1s'}}>
              Manage your security documentation and reports.
            </p>
          </div>
          
          <div className={`relative transition-all duration-300 ${searchFocused ? 'w-full md:w-80' : 'w-full md:w-64'}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-securetrack-purple focus:border-transparent transition-all duration-300 hover:shadow-sm"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-full bg-gradient-to-r from-securetrack-purple/10 via-securetrack-green/10 to-securetrack-purple/5 border-none overflow-hidden animate-fade-in shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldAlertIcon className="h-5 w-5 text-securetrack-purple animate-pulse" />
                <span>Security Compliance Status</span>
              </CardTitle>
              <CardDescription>Your documents are 85% compliant with security standards</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={85} className="h-2" indicatorClassName="bg-securetrack-purple" />
              <p className="text-sm mt-2 text-muted-foreground">17 of 20 required documents are up to date</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder, index) => (
            <Card 
              key={folder.title} 
              className="card-hover animate-fade-up bg-white hover:bg-gradient-to-br hover:from-white hover:to-securetrack-lightgray"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="flex flex-row items-center gap-2 group">
                <div className="h-10 w-10 rounded-full bg-securetrack-purple/10 flex items-center justify-center transition-all duration-300 group-hover:bg-securetrack-purple/20 group-hover:scale-110">
                  <FolderIcon className="h-5 w-5 text-securetrack-purple" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{folder.title}</CardTitle>
                  <CardDescription>{folder.count} documents</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress value={folder.usage} className="h-1.5" indicatorClassName={folder.color} />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-muted-foreground">Last updated {folder.updated}</p>
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-securetrack-purple/10 hover:text-securetrack-purple transition-colors">
                    View all
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-8 pt-4 border-t flex items-center gap-2">
          <span className="bg-gradient-to-r from-securetrack-purple to-securetrack-green bg-clip-text text-transparent">
            Recent Documents
          </span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <Card 
              key={file.title} 
              className="card-hover animate-fade-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <CardHeader className="flex flex-row items-center gap-2 pb-2 group">
                <div className="h-9 w-9 rounded bg-securetrack-green/10 flex items-center justify-center transition-all duration-300 group-hover:bg-securetrack-green/20 group-hover:rotate-3">
                  <FileIcon className="h-4 w-4 text-securetrack-green" />
                </div>
                <div>
                  <CardTitle className="text-base">{file.title}</CardTitle>
                  <CardDescription className="text-xs">{file.added}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{file.size}</span>
                  <span className={`px-2 py-1 rounded-full ${file.tagColor} ${file.tagTextColor}`}>
                    {file.tag}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

const folders = [
  { 
    title: "Security Policies", 
    count: 8, 
    usage: 75,
    updated: "2 days ago",
    color: "bg-securetrack-purple"
  },
  { 
    title: "Vulnerability Reports", 
    count: 12, 
    usage: 60,
    updated: "yesterday",
    color: "bg-securetrack-green"
  },
  { 
    title: "Compliance Documentation", 
    count: 5, 
    usage: 40,
    updated: "last week",
    color: "bg-blue-500"
  }
];

const files = [
  { 
    title: "Q2 Security Assessment.pdf", 
    added: "Added yesterday",
    size: "4.2 MB",
    tag: "Assessment",
    tagColor: "bg-securetrack-purple/15",
    tagTextColor: "text-securetrack-purple"
  },
  { 
    title: "API Gateway Penetration Test.pdf", 
    added: "Added 3 days ago",
    size: "2.8 MB",
    tag: "Penetration Test",
    tagColor: "bg-securetrack-green/15",
    tagTextColor: "text-securetrack-green"
  },
  { 
    title: "Cloud Infrastructure Review.pdf", 
    added: "Added last week",
    size: "5.1 MB",
    tag: "Review",
    tagColor: "bg-blue-500/15",
    tagTextColor: "text-blue-600"
  },
  { 
    title: "GDPR Compliance Checklist.pdf", 
    added: "Added 2 weeks ago",
    size: "1.8 MB",
    tag: "Compliance",
    tagColor: "bg-amber-500/15",
    tagTextColor: "text-amber-600"
  },
  { 
    title: "Incident Response Plan.docx", 
    added: "Added 2 weeks ago",
    size: "3.5 MB",
    tag: "Policy",
    tagColor: "bg-red-500/15",
    tagTextColor: "text-red-600"
  },
  { 
    title: "Monthly Security Report.pdf", 
    added: "Added last month",
    size: "7.2 MB",
    tag: "Report",
    tagColor: "bg-indigo-500/15",
    tagTextColor: "text-indigo-600"
  }
];

export default Documents;