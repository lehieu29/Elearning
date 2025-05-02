import React, { FC } from "react";

type Props = {
  videoUrl: string;
  title: string;
};

const CoursePlayer: FC<Props> = ({ videoUrl }) => {
  // Lấy cloud_name từ biến môi trường
  const cloudName = process.env.CLOUD_NAME || "do7haig17";
  
  // Encode videoUrl để dùng trong public_id
  const encodedVideoURL = encodeURIComponent(videoUrl);
  
  return (
    <div
      style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}
    >
      <iframe
          src={`https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${encodedVideoURL}&profile=cld-default`}
          style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0
              }}
              allowFullScreen={true}
              allow="encrypted-media"
        ></iframe>
    </div>
  );
};

export default CoursePlayer;
