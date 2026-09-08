import mongoose from "mongoose";
import projectModel from "../models/project.model.js";

export const createProject = async ({ name, userId }) => {
  if (!name) {
    throw new Error("Name is required");
  }
  if (!userId) {
    throw new Error("User is required");
  }

  let project;
  try {
    project = await projectModel.create({
      name,
      users: [userId],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Project with this name already exists");
    }
    throw error;
  }

  return project;
};

export const getAllProjectsByUserId = async ({ userId }) => {
  if (!userId) {
    throw new Error("User is required");
  }
  const allUserProjects = await projectModel
    .find({
      users: userId,
    })
    .populate("users", "email");
  return allUserProjects;
};

export const openDirectProject = async ({ userId, otherUserId }) => {
  if (!userId || !otherUserId) {
    throw new Error("Both users are required");
  }
  if (String(userId) === String(otherUserId)) {
    throw new Error("Pick someone else for a direct chat");
  }

  const pairKey = [String(userId), String(otherUserId)].sort().join(":");
  const existing = await projectModel
    .findOne({ pairKey })
    .populate("users", "email");
  if (existing) {
    return existing;
  }

  try {
    const created = await projectModel.create({
      name: `dm-${pairKey.replace(/:/g, "-")}`,
      users: [userId, otherUserId],
      pairKey,
    });
    return projectModel.findById(created._id).populate("users", "email");
  } catch (error) {
    if (error.code === 11000) {
      return projectModel.findOne({ pairKey }).populate("users", "email");
    }
    throw error;
  }
};

export const updateFileTree = async ({ projectId, fileTree, userId }) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }
  if (!fileTree || typeof fileTree !== "object") {
    throw new Error("fileTree is required");
  }

  const project = await projectModel.findOne({
    _id: projectId,
    users: userId,
  });
  if (!project) {
    throw new Error("User does not belong to this project");
  }

  project.fileTree = fileTree;
  await project.save();
  return project;
};

export const addUsersToProject = async ({ projectId, users, userId }) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }
  if (!users) {
    throw new Error("Users are required");
  }
  if (!userId) {
    throw new Error("UserId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }
  const project = await projectModel.findOne({
    _id: projectId,
    users: userId,
  });
  if (!project) {
    throw new Error("User does not belong to this project");
  }
  const updatedProject = await projectModel.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      $addToSet: {
        users: {
          $each: users,
        },
      },
    },
    {
      new: true,
    }
  );
  return updatedProject;
};

export const getProjectById = async ({ projectId }) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }
  const project = await projectModel
    .findOne({
      _id: projectId,
    })
    .populate("users");
  return project;
};
