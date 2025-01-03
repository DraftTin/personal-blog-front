import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import removeMarkdown from "remove-markdown";

const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 4;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5002/api/blogs?page=${page}&limit=${limit}`
        );
        setBlogs(response.data.blogs);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      }
    };

    fetchBlogs();
  }, [page]);

  const handlePageChange = (direction) => {
    setPage((prevPage) => Math.max(1, prevPage + direction));
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5002/api/blogs?search=${searchTerm}&limit=${limit}`
      );
      setBlogs(response.data.blogs);
    } catch (error) {
      console.error("Error fetching blogs", error);
    }
  };

  // truncate markdown text
  function truncateMarkdown(markdown, length) {
    const plainText = removeMarkdown(markdown);
    return plainText.length > length
      ? plainText.slice(0, length) + "..."
      : plainText;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
        Blogs
      </h1>
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search blogs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded p-2 mr-2 w-1/3"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <li
            key={blog._id}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              <Link to={`/blogs/${blog._id}`}>{blog.title}</Link>
            </h2>
            <p className="text-gray-700 mb-4">
              {truncateMarkdown(blog.content, 20)}{" "}
              {/* Truncate to 100 characters */}
            </p>
            <p className="text-sm text-gray-500">Author: {blog.author}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex justify-center items-center">
        <button
          className="mr-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray"
          disabled={page === 1}
          onClick={() => handlePageChange(-1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="ml-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray"
          disabled={page === totalPages}
          onClick={() => handlePageChange(1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Home;
