const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthentificationError } = require('apollo-server-express');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if(context.user) {
        const userData = await User.findOne({ _id: context.user._id });
        // .select('-password'); 
        select('-__v -password')
        return userData;
      }
      throw new AuthentificationError('You are not logged in');
    }
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return {
        token,
        user
      };
    },
    login: async (parent, { email, password}) => {
      const user = await User.findOne({ email });
      if(!user) {
        throw new AuthentificationError('User not found');
      }
      const correctPass = await user.isCorrectPassword(password); 
      if(!correctPass) {
        throw new AuthentificationError('Invalid password');
      }
      const token = signToken(user);
      return { token, user };
    }, 
    saveBook: async (parent, { input }, context) => {
      if(context.user) {
        const updateUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true }
        );
        return updateUser;
      }
      throw new AuthentificationError('You must be logged in to save a book');
    }, 
    removeBook: async (parent, args, context) => {
      if(context.user) {
        const updateUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },  
          { new: true }
        );
        return updateUser;
      }
      throw new AuthentificationError('You must be logged in to remove a book');
    }
  }
};

module.exports = resolvers;
    