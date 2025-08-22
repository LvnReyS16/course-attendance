"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import SectionForm from "@/components/SectionForm";
import { MdAdd, MdCategory } from "react-icons/md";

type Section = Database["public"]["Tables"]["sections"]["Row"] & {
  courses?: {
    code: string;
    title: string;
  } | null;
};

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("sections")
        .select(
          `
          *,
          courses (
            code,
            title
          )
        `
        )
        .order("name");

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = () => {
    setSelectedSectionId(null);
    setIsModalOpen(true);
  };

  const handleEditSection = (id: string) => {
    setSelectedSectionId(id);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSectionId(null);
  };

  const handleFormSuccess = () => {
    fetchSections();
    handleModalClose();
  };

  const handleDeleteSection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the sections list
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Failed to delete section. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shadow-sm">
              <MdCategory className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
              <p className="text-slate-600 text-sm">
                Manage section information and program assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddSection}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:from-orange-600 hover:to-orange-700"
          >
            <MdAdd className="w-5 h-5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h2 className="text-lg font-semibold text-slate-900">
            Section Records
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            A comprehensive list of all sections with their details and program
            information
          </p>
        </div>
        <div className="p-6">
          <DataTable
            data={sections}
            columns={[
              {
                header: "Section Name",
                accessor: "name",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((section) => section.name)),
                ],
              },
              {
                header: "Program",
                accessor: "program",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((section) => section.program)),
                ],
              },
              {
                header: "Year Level",
                accessor: "year_level",
                sortable: true,
                filterable: true,
                getFilterOptions: (data) => [
                  ...new Set(data.map((section) => String(section.year_level))),
                ],
              },
              {
                header: "Course",
                accessor: (section) =>
                  `${section.courses?.code || "N/A"} - ${section.courses?.title || "N/A"
                  }`,
                sortable: false,
                filterable: false,
              },
            ]}
            searchFields={["name", "program"]}
            isLoading={isLoading}
            onEdit={handleEditSection}
            onDelete={handleDeleteSection}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedSectionId ? 'Edit Section' : 'Add New Section'}
      >
        <SectionForm
          sectionId={selectedSectionId || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
}
