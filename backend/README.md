# How Clients Use the Token
## Frontend example (how to use the token):
```
// After login/register, save the token
const token = response.data.token;
localStorage.setItem('token', token);

// Include token in all future requests
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or for individual requests
fetch('/api/protected/route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```
