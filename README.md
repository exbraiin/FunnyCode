# FunnyCode

This is my first vscode extension aside from my custom theme.

This is a custom animation based on "Power Mode" extension.<br>
The visual of this extension was heavily inspired by jotson [Ridiculous Coding](https://github.com/jotson/ridiculous_coding). But I had to reduce the amount of effects a bit.

## Example

Here is a little example of how it looks when you write your code in the editor.

![example](/images/example.gif)

## Known Issues

When you write to close to the bounds of the editor panel, the animation is out of bounds, so you won't see it. <br> _However in most cases you'll be writing your code in the middle of the editor, so I didn't care much about fixing it._

## Extension Settings

`funnycode.enabled` can be set to `true` or `false` in order to enable or disable this extension on demand. <br> _A command can also be executed in order to change this setting. Search for "Toggle Funny Code" and it will toggle the setting on or off._

`funnycode.cursor` can be set to `true` or `false` in order to enable or disable the cursor decoration. <br> _The cursor is a "target" marker spawned at the cursor position._

`funnycode.grayscale` can be set to `true` or `false` in order to enable or disable the grayscale mode. <br> _Grayscale mode replaces the random color or each character with a grayscale color._

## How to install

1. You can download a [VSIX Release](releases/) file and install it through the extensions panel. <br> Press the options button ("...") and click "Install from VSIX".

2. You can also check the [Marketplace](https://marketplace.visualstudio.com/items?itemName=ExBrain.funnycode) for this extension

## Other

I hope you have fun with this extension.<br>
You can also download and modify it yourself if you want to.
