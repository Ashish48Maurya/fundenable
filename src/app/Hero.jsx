"use client"
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
    CircleUser,
    Menu,
    PanelRightClose,
    PanelRightOpen,
    BadgeCent,
    Download,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import toast from "react-hot-toast";
import Table from "./Table";
import * as XLSX from 'xlsx';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"


export function Hero() {
    const [isSidebarVisible, setSidebarVisible] = useState(true);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [selectedUser, setSelectedUser] = useState({ id: null, collectionName: '' });
    const [collection, setCollection] = useState([]);
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible((prev) => !prev);
    }, []);

    const toggleOpen = useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/collections/${selectedUser.collectionName || ''}`);
            const result = await response.json();
            if (response.ok) {
                if (!selectedUser.collectionName) {
                    setCollection(result?.collections);
                } else {
                    setData(result.data);
                }
            } else {
                toast.error(result.error || 'Error fetching data');
            }
        } catch (error) {
            toast.error(`Fetch error: ${error.message}`);
        }
    }, [selectedUser.collectionName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const download = useCallback(async (collectionName) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/download/${collectionName}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const { data } = await response.json();

            const formattedData = data.map((row) => {
                const formattedRow = { ...row };
                Object.keys(formattedRow).forEach((key) => {
                    let cellValue = formattedRow[key];
                    if (typeof cellValue === 'number' && cellValue > 10000 && cellValue < 60000) {
                        const excelDate = new Date((cellValue - 25569) * 86400 * 1000);
                        formattedRow[key] = excelDate.toLocaleDateString();
                    }
                });
                return formattedRow;
            });

            const newWorksheet = XLSX.utils.json_to_sheet(formattedData);
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

            const updatedBinaryString = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'binary' });
            const byteArray = new Uint8Array(updatedBinaryString.length);
            for (let i = 0; i < updatedBinaryString.length; i++) {
                byteArray[i] = updatedBinaryString.charCodeAt(i) & 0xFF;
            }

            const updatedBlob = new Blob([byteArray], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(updatedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${collectionName}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error downloading or processing the file:', error.message);
        }
    }, []);

    const handleFileChange = useCallback((event) => {
        setFile(event.target.files[0]);
    }, []);

    const handleUpload = useCallback(async (event) => {
        event.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/upload`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                toast.success(result.message);
                fetchData();
            } else {
                toast.error(result.error || result.message);
            }
        } catch (error) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [file, fetchData]);

    const [formData, setFormData] = useState(() => {
        return data.length > 0
            ? Object.keys(data[0]).reduce((acc, key) => {
                acc[key] = '';
                return acc;
            }, {})
            : {};
    });

    const handleInputChange = useCallback((key, value) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [key]: value,
        }));
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setAdding(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/collections/${selectedUser.collectionName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                setFormData({});
                fetchData();
            } else {
                toast.error(result.error || 'Error inserting data');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Internal Server Error');
        } finally {
            setAdding(false);
            toggleOpen();
        }
    };


    const handleDelete = async (collectionName) => {
        if (!collectionName) {
            toast.error('Collection name is required');
            return;
        }
        const confirmDelete = window.confirm(`Are you sure you want to delete the collection '${collectionName}'?`);
        if (!confirmDelete) {
            return;
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/collections/${collectionName}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                setSelectedUser({ id: null, collectionName: '' });
                toast.success(result.message);
            } else {
                toast.error(result.error || 'Error deleting collection');
            }
        } catch (error) {
            console.error('Error deleting collection:', error);
            toast.error(`Error: ${error.message}`);
        }
    };

    return (
        <div className={`${isSidebarVisible ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" : ""} grid min-h-screen w-full`}>

            {open &&
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add data to <span className="text-cyan-400" >{selectedUser.collectionName}</span></DialogTitle>
                        </DialogHeader>

                        {data.length > 0 && (
                            <div className="p-4 rounded-lg">
                                {Object.keys(data[0]).map((key, index) => (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <label className="font-medium">{key}:</label>
                                        <Input
                                            type="text"
                                            className="border ml-2 p-1 rounded-md w-2/3"
                                            defaultValue=""
                                            placeholder={`Enter value for ${key}`}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={adding} className="font-bold" onClick={handleSubmit} >{adding ? "Adding Data..." : "Add"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            }

            {isSidebarVisible && (
                <div className="hidden border-r bg-muted/40 md:block">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Link href="/" className="flex items-center gap-2 font-semibold">
                                <BadgeCent className="h-6 w-6" />
                                <span className="">
                                    Fund<strong className="text-cyan-400">Enable</strong>
                                </span>
                            </Link>
                            <Button
                                variant="outline"
                                size="icon"
                                className="ml-auto h-8 w-8"
                                onClick={toggleSidebar}
                            >
                                <PanelRightOpen />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                                {collection?.length === 0 ? (
                                    <span className="m-auto text-cyan-400">Data Not Available</span>
                                ) : (
                                    collection?.map((user, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded-lg flex justify-between ${selectedUser.id === index ? 'bg-muted' : ''}`}
                                            onClick={() => setSelectedUser({ id: index, collectionName: user })}
                                        >
                                            <Link href={`#${user}`}>
                                                {user}
                                            </Link>
                                            <div className="flex gap-2">
                                                <Download className="text-cyan-400" onClick={() => download(user)} />
                                                <Trash2 className="text-red-600" onClick={() => handleDelete(user)} />
                                            </div>
                                        </div>
                                    ))
                                )}

                            </nav>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link href="/" className="flex items-center gap-2 font-semibold">
                                    <BadgeCent className="h-6 w-6" />
                                    <span className="">
                                        Fund<strong className="text-cyan-400">Enable</strong>
                                    </span>
                                </Link>
                                {
                                    collection?.length === 0 ? <span className="m-auto text-cyan-400">Data Not Available</span> : <>

                                        {collection?.map((user, index) => (
                                            <div
                                                key={index}
                                                className={`mx-[-0.65rem] flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${selectedUser.id === index ? 'bg-muted' : ''}`}
                                                onClick={() => setSelectedUser({ id: index, collectionName: user })}
                                            >
                                                <Link href={`#${user}`}>
                                                    {user}
                                                </Link>
                                                <Download onClick={() => download(user)} />
                                            </div>
                                        ))}
                                    </>
                                }
                            </nav>
                        </SheetContent>
                    </Sheet>
                    {
                        !isSidebarVisible &&
                        <PanelRightClose onClick={toggleSidebar} />
                    }
                    <div className="w-full flex-1">
                        <form onSubmit={handleUpload}>
                            <div className="flex w-full max-w-sm items-center space-x-2">
                                <Input type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
                                <Button type="submit" disabled={loading} className="font-bold">{
                                    loading ? "Uploading..." : "Upload"
                                }</Button>
                            </div>
                        </form>
                    </div>

                    {
                        data.length !== 0 &&
                        <Button className="font-bold" onClick={toggleOpen}>Add Data</Button>
                    }

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </DropdownMenu>


                </header>


                {!selectedUser?.collectionName ?
                    <div className="flex items-center justify-center my-auto text-center">
                        <h3 className="text-2xl font-bold tracking-tight items-center">
                            Select file to view it&#39;s content
                        </h3>
                    </div> : <>{
                        data && (
                            <Table jsonData={data} />
                        )
                    }</>
                }
            </div>
        </div>
    );
}