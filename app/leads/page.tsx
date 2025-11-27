"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconUsers,
  IconMail,
  IconCalendar,
  IconTag,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";

interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  campaign: {
    name: string;
  } | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Stats {
  assigned: number;
  unassigned: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<Stats>({ assigned: 0, unassigned: 0 });
  const { toast } = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
      });
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLeads(data.data);
        setMeta(data.meta);
        if (data.stats) {
          setStats({
            assigned: data.stats.assigned ?? 0,
            unassigned: data.stats.unassigned ?? 0,
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search]);

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads Database</h2>
          <p className="text-muted-foreground mt-1">
            Manage and organize your contact database
          </p>
        </div>
        <div className="flex gap-2">
          <ImportLeadsDialog onSuccess={fetchLeads} />
          <AddLeadDialog onSuccess={fetchLeads} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <IconUsers className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <IconTag className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              To active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <IconMail className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                All Leads
              </CardTitle>
              <CardDescription className="mt-1.5">
                View and search through your contact database
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Date Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex justify-center items-center flex-col gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Loading leads...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <IconUsers className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">No leads found</p>
                          <p className="text-sm text-muted-foreground">
                            {search
                              ? "Try adjusting your search"
                              : "Get started by adding your first lead"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                            {lead.firstName[0]}
                            {lead.lastName?.[0] || ""}
                          </div>
                          <div>
                            <p className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <IconMail className="h-4 w-4" />
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.campaign ? (
                          <Badge variant="default" className="font-normal">
                            {lead.campaign.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            Unassigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconCalendar className="h-4 w-4" />
                          {new Date(lead.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * meta.limit + 1} to{" "}
                {Math.min(page * meta.limit, meta.total)} of {meta.total} leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === meta.totalPages ||
                        (p >= page - 1 && p <= page + 1)
                    )
                    .map((p, i, arr) => (
                      <div key={p} className="flex items-center">
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(p)}
                          className="w-9"
                        >
                          {p}
                        </Button>
                      </div>
                    ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={page === meta.totalPages}
                  className="gap-1"
                >
                  Next
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
