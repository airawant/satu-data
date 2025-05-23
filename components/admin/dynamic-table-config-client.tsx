"use client";

import { useState } from "react";
import { useDatasets } from "@/contexts/dataset-context";
import { DynamicTableConfigForm } from "@/components/admin/dynamic-table-config-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export function DynamicTableConfigClient() {
  const { datasets, loading } = useDatasets();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("konfigurasi");

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId);

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pilih Dataset</CardTitle>
          <CardDescription>
            Pilih dataset yang ingin dikonfigurasi untuk tabel dinamis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <p>Memuat dataset...</p>
            </div>
          ) : datasets.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tidak ada dataset</AlertTitle>
              <AlertDescription>
                Tidak ada dataset yang tersedia. Silakan unggah dataset terlebih dahulu.
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              value={selectedDatasetId}
              onValueChange={(value) => setSelectedDatasetId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedDataset && (
        <Tabs
          defaultValue="konfigurasi"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsContent value="konfigurasi">
            <DynamicTableConfigForm dataset={selectedDataset} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
