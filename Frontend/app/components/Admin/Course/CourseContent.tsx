import { styles } from "@/app/styles/style";
import Link from "next/link";
import React, { FC, useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineDelete, AiOutlinePlusCircle } from "react-icons/ai";
import { BsLink45Deg, BsPencil } from "react-icons/bs";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { useUploadVideoMutation } from "@/redux/features/courses/coursesApi";
import { useVideoQueue } from "@/app/contexts/VideoQueueContext";

type Props = {
  active: number;
  setActive: (active: number) => void;
  courseContentData: any;
  setCourseContentData: (courseContentData: any) => void;
  handleSubmit: any;
};

const CourseContent: FC<Props> = ({
  courseContentData,
  setCourseContentData,
  active,
  setActive,
  handleSubmit: handlleCourseSubmit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    Array(courseContentData.length).fill(false)
  );

  const [activeSection, setActiveSection] = useState(1);
  const [uploadVideo, { isLoading }] = useUploadVideoMutation();
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [uploadedFileNames, setUploadedFileNames] = useState(Array(courseContentData.length).fill(""));
  
  // Thêm videoQueue hook
  const { addToQueue, setVideoUrlFromQueue } = useVideoQueue();

  const handleSubmit = (e: any) => {
    e.preventDefault();
  };

  const handleCollapseToggle = (index: number) => {
    const updatedCollasped = [...isCollapsed];
    updatedCollasped[index] = !updatedCollasped[index];
    setIsCollapsed(updatedCollasped);
  };

  const handleRemoveLink = (index: number, linkIndex: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.splice(linkIndex, 1);
    setCourseContentData(updatedData);
  };

  const handleAddLink = (index: number) => {
    const updatedData = [...courseContentData];
    updatedData[index].links.push({ title: "", url: "" });
    setCourseContentData(updatedData);
  };

  const handleVideoUpload = (file: File, index: number) => {
  if (!file) return;

  // Log information for debugging
  console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);

  // Check file size and format
  if (file.size === 0) {
  toast.error("File is empty, please select another file", { duration: 4000 });
  return;
  }

  if (!file.type.startsWith('video/')) {
  toast.error("Please select a valid video file", { duration: 4000 });
  return;
  }

  // Update uploading status
  setCurrentUploadIndex(index);

  // Update the file name for this index
  const updatedFileNames = [...uploadedFileNames];
  updatedFileNames[index] = file.name;
  setUploadedFileNames(updatedFileNames);

  // Show loading toast
  const loadingToast = toast.loading("Starting upload...", { duration: 5000 });

  uploadVideo(file)
  .unwrap()
  .then((result) => {
  console.log('Upload started:', result);
  toast.dismiss(loadingToast);
  toast.success("Upload started! You can continue editing", { duration: 3000 });
  
  // Thêm video vào queue
  addToQueue({
    processId: result.processId,
          fileName: file.name,
    uploadType: "content",
    contentIndex: index,
  });
  })
  .catch((error) => {
  console.error('Upload error:', error);
  toast.dismiss(loadingToast);
        toast.error(error.data?.message || "Unknown error when uploading video", { duration: 5000 });

    // Reset the file name for this index
    const updatedFileNames = [...uploadedFileNames];
  updatedFileNames[index] = "";
  setUploadedFileNames(updatedFileNames);
  });
  };

  const newContentHandler = (item: any) => {
    if (
      item.title === "" ||
      item.description === "" ||
      item.videoUrl === ""
    ) {
      toast.error("Please fill all the fields first!");
    } else {
      let newVideoSection = "";

      if (courseContentData.length > 0) {
        const lastVideoSection =
          courseContentData[courseContentData.length - 1].videoSection;

        // use the last videoSection if available, else use user input
        if (lastVideoSection) {
          newVideoSection = lastVideoSection;
        }
      }
      const newContent = {
        videoUrl: "",
        title: "",
        description: "",
        videoSection: newVideoSection,
        videoLength: "",
        links: [{ title: "", url: "" }],
      };

      setCourseContentData([...courseContentData, newContent]);
      setUploadedFileNames([...uploadedFileNames, ""]);
    }
  };

  const addNewSection = () => {
    if (
      courseContentData[courseContentData.length - 1].title === "" ||
      courseContentData[courseContentData.length - 1].description === "" ||
      courseContentData[courseContentData.length - 1].videoUrl === ""
    ) {
      toast.error("Please fill all the fields first!");
    } else {
      setActiveSection(activeSection + 1);
      const newContent = {
        videoUrl: "",
        title: "",
        description: "",
        videoLength: "",
        videoSection: `Untitled Section ${activeSection}`,
        links: [{ title: "", url: "" }],
      };
      setCourseContentData([...courseContentData, newContent]);
      setUploadedFileNames([...uploadedFileNames, ""]);
    }
  };

  const prevButton = () => {
    setActive(active - 1);
  };

  const handleOptions = () => {
    // Kiểm tra chỉ có title và description, bỏ kiểm tra videoUrl
    if (
      courseContentData[courseContentData.length - 1].title === "" ||
      courseContentData[courseContentData.length - 1].description === ""
    ) {
      toast.error("Please fill title and description fields!");
    } else {
      // Cập nhật videoUrl cho tất cả các video đã upload
      const updatedData = [...courseContentData];
      
      updatedData.forEach((item, index) => {
        const { publicId, duration } = setVideoUrlFromQueue("content", index);
        if (publicId && !item.videoUrl) {
          updatedData[index].videoUrl = publicId;
          
          // Cập nhật videoLength nếu có duration
          if (duration) {
            const durationInMinutes = Math.ceil(duration / 60);
            updatedData[index].videoLength = durationInMinutes.toString();
          }
        }
      });
      
      setCourseContentData(updatedData);
      toast.success("Course content saved");
      setActive(active + 1);
      handlleCourseSubmit();
    }
  };

  return (
    <div className="w-[80%] m-auto mt-24 p-3">
      <a
        href="http://3.145.11.146:8501/"
        className="p-2 bg-blue-500 rounded-md"
        target="_blank"
      >
        Add video to AI
      </a>
      <form onSubmit={handleSubmit}>
        {courseContentData?.map((item: any, index: number) => {
          const showSectionInput =
            index === 0 ||
            item.videoSection !== courseContentData[index - 1].videoSection;

          return (
            <>
              <div
                className={`w-full bg-[#cdc8c817] p-4 ${showSectionInput ? "mt-10" : "mb-0"
                  }`}
                key={index}
              >
                {showSectionInput && (
                  <>
                    <div className="flex w-full items-center">
                      <input
                        type="text"
                        className={`text-[20px] ${item.videoSection === "Untitled Section"
                            ? "w-[170px]"
                            : "w-min"
                          } font-Poppins cursor-pointer dark:text-white text-black bg-transparent outline-none`}
                        value={item.videoSection}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].videoSection = e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                      <BsPencil className="cursor-pointer dark:text-white text-black" />
                    </div>
                    <br />
                  </>
                )}

                <div className="flex w-full items-center justify-between my-0">
                  {isCollapsed[index] ? (
                    <>
                      {item.title ? (
                        <p className="font-Poppins dark:text-white text-black">
                          {index + 1}. {item.title}
                        </p>
                      ) : (
                        <></>
                      )}
                    </>
                  ) : (
                    <div></div>
                  )}

                  {/* // arrow button for collasped video content */}
                  <div className="flex items-center">
                    <AiOutlineDelete
                      className={`dark:text-white text-[20px] mr-2 text-black ${index > 0 ? "cursor-pointer" : "cursor-no-drop"
                        }`}
                      onClick={() => {
                        if (index > 0) {
                          const updatedData = [...courseContentData];
                          updatedData.splice(index, 1);
                          setCourseContentData(updatedData);

                          const updatedFileNames = [...uploadedFileNames];
                          updatedFileNames.splice(index, 1);
                          setUploadedFileNames(updatedFileNames);
                        }
                      }}
                    />
                    <MdOutlineKeyboardArrowDown
                      fontSize="large"
                      className="dark:text-white text-black"
                      style={{
                        transform: isCollapsed[index]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                      onClick={() => handleCollapseToggle(index)}
                    />
                  </div>
                </div>
                {!isCollapsed[index] && (
                  <>
                    <div className="my-3">
                      <label className={styles.label}>Video Title</label>
                      <input
                        type="text"
                        placeholder="Project Plan..."
                        className={`${styles.input}`}
                        value={item.title}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].title = e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className={styles.label}>Video</label>
                      <input
                        type="file"
                        accept="video/*"
                        id={`videoFile-${index}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleVideoUpload(file, index);
                          }
                        }}
                      />
                      <label
                        htmlFor={`videoFile-${index}`}
                        className="mt-[10px] h-[40px] cursor-pointer rounded dark:border-white border-[#00000026] p-3 border flex items-center justify-center bg-transparent"
                      >
                        {uploadedFileNames[index] || (item.videoUrl ? "Video uploaded" : "Choose File")}
                      </label>

                      {/* Display video duration if available */}
                      {item.videoLength && (
                        <div className="mt-2 text-sm dark:text-gray-300 text-gray-700">
                          Duration: {item.videoLength} minutes
                        </div>
                      )}

                      {/* Hidden input to store the videoUrl value */}
                      <input
                        type="hidden"
                        value={item.videoUrl}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].videoUrl = e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />

                      {/* Hidden input to store the videoLength value */}
                      <input
                        type="hidden"
                        value={item.videoLength}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].videoLength = e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className={styles.label}>Video Description</label>
                      <textarea
                        rows={8}
                        cols={30}
                        placeholder="Video description..."
                        className={`${styles.input} !h-min py-2`}
                        value={item.description}
                        onChange={(e) => {
                          const updatedData = [...courseContentData];
                          updatedData[index].description = e.target.value;
                          setCourseContentData(updatedData);
                        }}
                      />
                      <br />
                    </div>
                    {/*item?.links.map((link: any, linkIndex: number) => (
                      <div className="mb-3 block" key={linkIndex}>
                        <div className="w-full flex items-center justify-between">
                          <label className={styles.label}>
                            Link {linkIndex + 1}
                          </label>
                          <AiOutlineDelete
                            className={`${
                              linkIndex === 0
                                ? "cursor-no-drop"
                                : "cursor-pointer"
                            } text-black dark:text-white text-[20px]`}
                            onClick={() =>
                              linkIndex === 0
                                ? null
                                : handleRemoveLink(index, linkIndex)
                            }
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Source Code... (Link title)"
                          className={`${styles.input}`}
                          value={link.title}
                          onChange={(e) => {
                            const updatedData = [...courseContentData];
                            updatedData[index].links[linkIndex].title =
                              e.target.value;
                            setCourseContentData(updatedData);
                          }}
                        />
                        <input
                          type="url"
                          placeholder="Source Code Url... (Link URL)"
                          className={`${styles.input} mt-6`}
                          value={link.url}
                          onChange={(e) => {
                            const updatedData = [...courseContentData];
                            updatedData[index].links[linkIndex].url =
                              e.target.value;
                            setCourseContentData(updatedData);
                          }}
                        />
                      </div>
                    ))*/}

                    {/* add link button */}
                    <div className="hidden inline-block mb-4">
                      <p
                        className="flex items-center text-[18px] dark:text-white text-black cursor-pointer"
                        onClick={() => handleAddLink(index)}
                      >
                        <BsLink45Deg className="mr-2" /> Add Link
                      </p>
                    </div>
                  </>
                )}
                <br />
                {/* add new content */}
                {index === courseContentData.length - 1 && (
                  <div>
                    <p
                      className="flex items-center text-[18px] dark:text-white text-black cursor-pointer"
                      onClick={(e: any) => newContentHandler(item)}
                    >
                      <AiOutlinePlusCircle className="mr-2" /> Add New Content
                    </p>
                  </div>
                )}
              </div>
            </>
          );
        })}
        <br />
        <div
          className="flex items-center text-[20px] dark:text-white text-black cursor-pointer"
          onClick={() => addNewSection()}
        >
          <AiOutlinePlusCircle className="mr-2" /> Add new Section
        </div>
      </form>
      <br />
      <div className="w-full flex items-center justify-between">
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => prevButton()}
        >
          Prev
        </div>
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => handleOptions()}
        >
          Next
        </div>
      </div>
      <br />
      <br />
      <br />
    </div>
  );
};

export default CourseContent;