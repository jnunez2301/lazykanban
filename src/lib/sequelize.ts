import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'lazykanban',
  dialect: 'mysql',
  username: process.env.DB_USER || 'lazykanban',
  password: process.env.DB_PASSWORD || 'your_secure_password_here',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  models: [__dirname + '/../models/**/*.ts'],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
