require('package-script').spawn([
    {
        command: "npm",
        args: ["install", "-g", "gulp-cli"]
    },
    {
        command: "npm",
        args: ["install", "-g", "bower"]
    }
]);
