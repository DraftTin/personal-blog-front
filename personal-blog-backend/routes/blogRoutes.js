import express from "express";
import Blog from "../models/Blog.js";
import validateBlog from "../middleware/validateBlog.js";
import protect from "../middleware/authMiddleware.js";
import Activity from "../models/Activity.js";

const router = express.Router();

// create a blog
router.post("/create", protect, validateBlog, async (req, res) => {
  const { title, content } = req.body;
  try {
    const newBlog = new Blog({
      title,
      content,
      author: req.user.id,
    });

    // Log the Activity
    await Activity.create({
      userId: req.user.id,
      action: "created",
      resource: "blog",
      resourceId: newBlog._id,
    });
    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    res.status(500).json({ message: "Error creating blog" });
  }
});

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Pagination
    const skip = (page - 1) * limit;

    // Fuzzy Search
    const query = {
      ...(search && {
        $or: [
          { title: new RegExp(search, "i") },
          { content: new RegExp(search, "i") },
        ],
      }),
      ...(category && { category }),
    };
    const blogs = await Blog.find(query)
      .populate("author", "username")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(query);

    res.status(200).json({
      totalBlogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

// Get a blog by ID
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  try {
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog by ID:", error);
    res.status(500).json({ message: "Error fetching blog by ID" });
  }
});

// Update a blog by ID
router.put("/:id", async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(updatedBlog);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error updating blog:", error);
    res.status(500).json({ message: "Error updating blog" });
  }
});

// Delete a blog by ID
router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedBlog = await Blog.findById(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    if (deletedBlog.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this blog" });
    }
    await deletedBlog.deleteOne();
    // Log the activity
    await Activity.create({
      userId: req.user.id,
      action: "deleted",
      resource: "blog",
      resourceId: deletedBlog._id,
    });
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog" });
  }
});

export default router;
