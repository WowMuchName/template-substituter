# Template-Substituter

Evaluates EJS templates reading data from environment variable and commandline arguments.

## Installation

### Global
```
npm i -g template-substituter
```


### Local
```
npm i template-substituter --save
```

## Usage
Assuming this template
```
Hello <%=myVariable%>
```

Template-substituter will try to:

1. Find an commandline argument _--myVariable_
2. Find an environment variable _myVariable_

Note that all variable are camelized.
MY-VARIABLE, MY_VARIABLE, my-variable and myVariable are all considered the same.


Files that end with _.ejs_ will be evaluated into a version without this suffix.

Files not ending with _.ejs_ will be evaluated *in place*.