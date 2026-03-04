import Link from "next/link";

type LeadDetailsPageProps = {
  params: Promise<{ id: string }>;
};

interface ContactEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  author: string;
  type: "info" | "success" | "warning" | "error";
}

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

const leadData = {
  id: "LD001",
  customer: {
    name: "Alex Rodriguez",
    email: "alex.rodriguez@example.com",
    phone: "+1 (555) 234-5678",
    company: "Rodriguez Logistics",
    address: "456 Business Ave, Corporate City, CC 54321",
  },
  source: "website",
  interest: "Fleet maintenance contract",
  description:
    "Looking for comprehensive maintenance solution for company fleet of 15 vehicles including regular servicing, emergency repairs, and parts replacement.",
  priority: "high" as const,
  status: "qualified" as const,
  assignedTo: {
    name: "Sarah Johnson",
    email: "sarah@shahzaibautos.com",
    role: "Sales Manager",
  },
  createdDate: "2024-01-20T09:15:00Z",
  lastContact: "2024-01-22T14:30:00Z",
  nextFollowUp: "2024-01-25T10:00:00Z",
  estimatedValue: 12000,
  probability: 75,
  expectedCloseDate: "2024-02-15",
};

const contactHistory: ContactEvent[] = [
  {
    id: "1",
    title: "Quote Sent",
    description: "Detailed quote for fleet maintenance contract sent via email",
    timestamp: "2024-01-22T14:30:00Z",
    author: "Sarah Johnson",
    type: "success",
  },
  {
    id: "2",
    title: "Phone Call",
    description: "30-minute call to discuss requirements and pricing structure",
    timestamp: "2024-01-21T11:15:00Z",
    author: "Sarah Johnson",
    type: "info",
  },
  {
    id: "3",
    title: "Email Response",
    description: "Responded to initial inquiry with service overview",
    timestamp: "2024-01-20T15:45:00Z",
    author: "Sarah Johnson",
    type: "info",
  },
  {
    id: "4",
    title: "Lead Qualified",
    description: "Lead marked as qualified after initial assessment",
    timestamp: "2024-01-20T12:30:00Z",
    author: "Sarah Johnson",
    type: "success",
  },
  {
    id: "5",
    title: "Initial Inquiry",
    description: "Customer submitted contact form on website",
    timestamp: "2024-01-20T09:15:00Z",
    author: "System",
    type: "info",
  },
];

const notes: Note[] = [
  {
    id: "1",
    content:
      "Customer is very interested in our comprehensive maintenance packages. Emphasized the importance of minimal vehicle downtime for their operations.",
    author: "Sarah Johnson",
    timestamp: "2024-01-22T14:45:00Z",
  },
  {
    id: "2",
    content:
      "Fleet consists mostly of Toyota and Honda vehicles, 2-5 years old. They're looking for preventive maintenance to extend vehicle life.",
    author: "Sarah Johnson",
    timestamp: "2024-01-21T11:30:00Z",
  },
  {
    id: "3",
    content:
      "Decision maker is Alex Rodriguez (owner). Budget approved, waiting for board review scheduled for February 10th.",
    author: "Sarah Johnson",
    timestamp: "2024-01-20T16:00:00Z",
  },
];

const getEventIcon = (type: string) => {
  switch (type) {
    case "success":
      return "check_circle";
    case "warning":
      return "warning";
    case "error":
      return "error";
    default:
      return "info";
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-500";
    case "warning":
      return "text-orange-500";
    case "error":
      return "text-red-500";
    default:
      return "text-blue-500";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "text-blue-600 bg-blue-50";
    case "contacted":
      return "text-orange-600 bg-orange-50";
    case "qualified":
      return "text-purple-600 bg-purple-50";
    case "converted":
      return "text-green-600 bg-green-50";
    case "lost":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-orange-600 bg-orange-50";
    case "low":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getProbabilityColor = (probability: number) => {
  if (probability >= 75) return "text-green-600 bg-green-50";
  if (probability >= 50) return "text-orange-600 bg-orange-50";
  if (probability >= 25) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export default async function LeadDetailsPage({
  params,
}: LeadDetailsPageProps) {
  const { id } = await params;
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/admin/dashboard/leads"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Lead #{id}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leadData.status)}`}
            >
              {leadData.status}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(leadData.priority)}`}
            >
              {leadData.priority} priority
            </span>
          </div>
          <p className="text-muted-foreground">
            Created on {new Date(leadData.createdDate).toLocaleDateString()} •
            Last contact {new Date(leadData.lastContact).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">call</span>
              Call
            </span>
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">email</span>
              Email
            </span>
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lead Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Lead Information */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Lead Information
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm text-muted-foreground">
                  Interest/Service Required
                </label>
                <p className="font-medium text-foreground text-lg">
                  {leadData.interest}
                </p>
                <p className="text-muted-foreground mt-2">
                  {leadData.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Source
                  </label>
                  <p className="font-medium text-foreground capitalize">
                    {leadData.source}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Assigned Sales Rep
                  </label>
                  <p className="font-medium text-foreground">
                    {leadData.assignedTo.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {leadData.assignedTo.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Estimated Value
                  </label>
                  <p className="font-medium text-foreground text-lg">
                    PKR {leadData.estimatedValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Win Probability
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">
                      {leadData.probability}%
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getProbabilityColor(leadData.probability)}`}
                    >
                      {leadData.probability >= 75
                        ? "High"
                        : leadData.probability >= 50
                          ? "Medium"
                          : "Low"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Expected Close Date
                  </label>
                  <p className="font-medium text-foreground">
                    {leadData.expectedCloseDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact History */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Contact History
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {contactHistory.map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${getEventColor(event.type)} bg-opacity-10`}
                    >
                      <span
                        className={`material-symbols-outlined text-sm ${getEventColor(event.type)}`}
                      >
                        {getEventIcon(event.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">
                          {event.title}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        by {event.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Notes</h2>
                <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors">
                  Add Note
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {notes.map((note) => (
                  <div key={note.id} className="bg-muted/30 rounded-lg p-4">
                    <p className="text-foreground mb-3">{note.content}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>by {note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="font-medium text-foreground">
                  {leadData.customer.name}
                </p>
              </div>
              {leadData.customer.company && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    Company
                  </label>
                  <p className="font-medium text-foreground">
                    {leadData.customer.company}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium text-foreground">
                  {leadData.customer.email}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <p className="font-medium text-foreground">
                  {leadData.customer.phone}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Address</label>
                <p className="font-medium text-foreground">
                  {leadData.customer.address}
                </p>
              </div>
            </div>
          </div>

          {/* Follow-up Schedule */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Follow-up Schedule
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Next Follow-up
                </label>
                <p className="font-medium text-foreground">
                  {new Date(leadData.nextFollowUp).toLocaleString()}
                </p>
              </div>
              <button className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors">
                Schedule Follow-up
              </button>
            </div>
          </div>

          {/* Lead Score */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Lead Score
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  85/100
                </div>
                <p className="text-sm text-muted-foreground">Qualified Lead</p>
                <div className="w-full bg-muted rounded-full h-2 mt-4">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">
                    call
                  </span>
                  <span className="text-foreground">Call Customer</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">
                    email
                  </span>
                  <span className="text-foreground">Send Email</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-purple-500">
                    description
                  </span>
                  <span className="text-foreground">Send Quote</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-500">
                    schedule
                  </span>
                  <span className="text-foreground">Schedule Meeting</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">
                    check_circle
                  </span>
                  <span className="text-foreground">Mark as Converted</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
