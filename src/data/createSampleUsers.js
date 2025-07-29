// Sample users for testing mentions functionality
export const createSampleUsers = async () => {
  const sampleUsers = [
  {
    user_id: "user-1",
    full_name: "John Doe",
    nickname: "john",
    role: "admin",
    is_active: true
  },
  {
    user_id: "user-2",
    full_name: "Jane Smith",
    nickname: "jane",
    role: "developer",
    is_active: true
  },
  {
    user_id: "user-3",
    full_name: "Bob Wilson",
    nickname: "bob",
    role: "user",
    is_active: true
  },
  {
    user_id: "user-4",
    full_name: "Alice Johnson",
    nickname: "alice",
    role: "user",
    is_active: true
  }];


  try {
    console.log('Creating sample users...');

    for (const user of sampleUsers) {
      try {
        const { error } = await window.ezsite.apis.tableCreate(31708, user);
        if (error) {
          console.error('Error creating user:', user.nickname, error);
        } else {
          console.log('✅ Created user:', user.nickname);
        }
      } catch (err) {
        console.log('User might already exist:', user.nickname);
      }
    }

    console.log('✅ Sample users creation completed');
    return true;
  } catch (error) {
    console.error('Error creating sample users:', error);
    return false;
  }
};