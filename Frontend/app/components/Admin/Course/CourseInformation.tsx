/* eslint-disable @next/next/no-img-element */
import { styles } from "@/app/styles/style";
import { useUploadVideoMutation } from "@/redux/features/courses/coursesApi";
import { useGetHeroDataQuery } from "@/redux/features/layout/layoutApi";
import React, { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useVideoQueue } from "@/app/contexts/VideoQueueContext";

// Configuration toggle for sync/async upload
// TODO
const USE_SYNC_UPLOAD = false; // Change to false to rollback to async mode

type Props = {
  courseInfo: any;
  setCourseInfo: (courseInfo: any) => void;
  active: number;
  setActive: (active: number) => void;
};

const CourseInformation: FC<Props> = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}) => {
  const [uploadVideo, { isLoading }] = useUploadVideoMutation();
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const { data } = useGetHeroDataQuery("Categories", {});
  const [categories, setCategories] = useState([]);
  
  // Thêm videoQueue hook
  const { addToQueue, setVideoUrlFromQueue } = useVideoQueue();
  
  // Loading state for sync upload
  const [isSyncUploading, setIsSyncUploading] = useState(false);

  useEffect(() => {
    if (data) {
      setCategories(data.layout.categories);
    }
  }, [data]);

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // Bỏ validate demoUrl - chỉ validate các trường thông tin cơ bản
    if (!courseInfo.name || courseInfo.name.trim() === "") {
      toast.error("Please enter course name");
      return;
    }

    if (!courseInfo.description || courseInfo.description.trim() === "") {
      toast.error("Please enter course description");
      return;
    }

    if (!courseInfo.price || courseInfo.price <= 0) {
      toast.error("Please enter valid course price");
      return;
    }

    if (!courseInfo.tags || courseInfo.tags.trim() === "") {
      toast.error("Please enter course tags");
      return;
    }

    if (!courseInfo.level || courseInfo.level.trim() === "") {
      toast.error("Please specify course level");
      return;
    }

    if (!courseInfo.thumbnail) {
      toast.error("Please upload a thumbnail image");
      return;
    }

    // Cập nhật demoUrl từ video đã upload (nếu có)
    const { publicId } = setVideoUrlFromQueue("demo");
    console.log("Public ID from queue (DemoURL): ", publicId);
    if (publicId && !courseInfo.demoUrl) {
      setCourseInfo({ ...courseInfo, demoUrl: publicId });
    }

    // Optional validation for categories if needed
    if (!courseInfo.categories) {
      toast.error("Please select a category");
      return;
    }

    toast.success("Course information saved");
    setActive(active + 1);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        if (reader.readyState === 2) {
          setCourseInfo({ ...courseInfo, thumbnail: reader.result });
          toast.success("Thumbnail uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setCourseInfo({ ...courseInfo, thumbnail: reader.result });
        toast.success("Thumbnail uploaded successfully", { duration: 3000 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (file: File) => {
    if (!file) return;

    // Log thông tin file để debug
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Kiểm tra kích thước và định dạng
    if (file.size === 0) {
      toast.error("File is empty, please select another file", { duration: 4000 });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast.error("Please select a valid video file", { duration: 4000 });
      return;
    }

    // Lưu tên file
    setUploadedFileName(file.name);

    // Hiển thị toast uploading
    const loadingToast = toast.loading("Starting upload...", { duration: 5000 });

    if (USE_SYNC_UPLOAD) {
      // Luồng xử lý đồng bộ mới
      setIsSyncUploading(true);
      uploadVideo(file)
        .unwrap()
        .then((result: any) => {
          console.log('Upload success (sync):', result);
          toast.dismiss(loadingToast);
          toast.success("Video uploaded successfully!", { duration: 3000 });
          
          // Gán publicId vào demoUrl
          if (result.data && result.data.publicId) {
            setCourseInfo({ ...courseInfo, demoUrl: result.data.publicId });
          }
          
          // Không cần thêm vào queue vì đã xử lý xong
        })
        .catch((error) => {
          console.error('Upload error:', error);
          toast.dismiss(loadingToast);
          toast.error(error.data?.message || "Error uploading video", { duration: 5000 });
          setUploadedFileName("");
        })
        .finally(() => {
          setIsSyncUploading(false);
        });
    } else {
      // Giữ nguyên logic cũ để có thể rollback
      uploadVideo(file)
        .unwrap()
        .then((result) => {
          console.log('Upload started:', result);
          toast.dismiss(loadingToast);
          toast.success("Upload started! You can continue editing while it processes", { duration: 3000 });
          
          // Thêm video vào queue
          addToQueue({
            processId: result.processId,
            fileName: file.name,
            uploadType: "demo",
          });
        })
        .catch((error) => {
          console.error('Upload error:', error);
          toast.dismiss(loadingToast);
          toast.error(error.data?.message || "Unknown error when uploading video", { duration: 5000 });
          setUploadedFileName("");
        });
    }
  };

  return (
    <div className="w-[80%] m-auto mt-24">
      <form onSubmit={handleSubmit} className={`${styles.label}`}>
        <div>
          <label htmlFor="">Course Name</label>
          <input
            type="name"
            name=""
            // Removed required
            value={courseInfo.name}
            onChange={(e: any) =>
              setCourseInfo({ ...courseInfo, name: e.target.value })
            }
            id="name"
            placeholder="MERN stack LMS platform with next 13"
            className={`
            ${styles.input}`}
          />
        </div>
        <br />
        <div className="mb-5">
          <label className={`${styles.label}`}>Course Description</label>
          <textarea
            name=""
            id=""
            cols={30}
            rows={8}
            placeholder="Write something amazing..."
            className={`${styles.input} !h-min !py-2`}
            value={courseInfo.description}
            onChange={(e: any) =>
              setCourseInfo({ ...courseInfo, description: e.target.value })
            }
          ></textarea>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label className={`${styles.label}`}>Course Price</label>
            <input
              type="number"
              name=""
              // Removed required
              value={courseInfo.price}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, price: e.target.value })
              }
              id="price"
              placeholder="29"
              className={`
            ${styles.input}`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`${styles.label} w-[50%]`}>
              Estimated Price (optional)
            </label>
            <input
              type="number"
              name=""
              value={courseInfo.estimatedPrice}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, estimatedPrice: e.target.value })
              }
              id="price"
              placeholder="79"
              className={`
            ${styles.input}`}
            />
          </div>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label className={`${styles.label}`} htmlFor="email">
              Course Tags
            </label>
            <input
              type="text"
              // Removed required
              name=""
              value={courseInfo.tags}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, tags: e.target.value })
              }
              id="tags"
              placeholder="MERN,Next 13,Socket io,tailwind css,LMS"
              className={`
            ${styles.input}`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`${styles.label} w-[50%]`}>
              Course Categories
            </label>
            <select
              name=""
              id=""
              className={`${styles.input}`}
              value={courseInfo.category}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, categories: e.target.value })
              }
            >
              <option
                className="dark:text-white dark:bg-slate-700 bg-gray-200"
                value=""
              >
                Select Category
              </option>
              {categories &&
                categories.map((item: any) => (
                  <option
                    className="dark:text-white dark:bg-black"
                    value={item.title}
                    key={item._id}
                  >
                    {item.title}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <br />
        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label className={`${styles.label}`}>Course Level</label>
            <input
              type="text"
              name=""
              value={courseInfo.level}
              // Removed required
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, level: e.target.value })
              }
              id="level"
              placeholder="Beginner/Intermediate/Expert"
              className={`
            ${styles.input}`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`${styles.label} w-[50%]`}>Video Demo</label>
            <input
              type="file"
              name="video"
              accept="video/*"
              // Removed required
              id="demoURL"
              disabled={isSyncUploading}
              onChange={(e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleVideoUpload(file);
                }
              }}
              className={`
            ${styles.input} hidden`}
            />
            <label 
              htmlFor="demoURL" 
              className={`mt-[10px] h-[40px] cursor-pointer rounded dark:border-white border-[#00000026] p-3 border flex items-center justify-center bg-transparent ${isSyncUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSyncUploading ? "Uploading..." : (uploadedFileName || (courseInfo.demoUrl ? "Video uploaded" : "Choose File"))}
            </label>
          </div>
        </div>
        <br />
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            id="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file"
            className={`w-full min-h-[10vh] dark:border-white border-[#00000026] p-3 border flex items-center justify-center ${dragging ? "bg-blue-500" : "bg-transparent"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {courseInfo.thumbnail ? (
              <img
                src={courseInfo.thumbnail}
                alt=""
                className="max-h-full w-full object-cover"
              />
            ) : (
              <span className="text-black dark:text-white">
                Drag and drop your thumbnail here or click to browse
              </span>
            )}
          </label>
        </div>
        <br />
        <div className="w-full flex items-center justify-end">
          <input
            type="submit"
            value="Next"
            className="w-full 800px:w-[180px] h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          />
        </div>
        <br />
        <br />
      </form>
    </div>
  );
};

export default CourseInformation;